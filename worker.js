export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        const TURSO_URL = env.TURSO_URL || 'https://portfolio-rauffathigovashin.aws-eu-west-1.turso.io';
        const TURSO_AUTH_TOKEN = env.TURSO_AUTH_TOKEN;

        async function queryTurso(sql, args = []) {
            const formattedArgs = args.map(arg => {
                if (arg === null || arg === undefined) return { type: 'null' };
                if (typeof arg === 'number') {
                    return Number.isInteger(arg) 
                        ? { type: 'integer', value: String(arg) } 
                        : { type: 'float', value: arg };
                }
                if (typeof arg === 'boolean') return { type: 'integer', value: arg ? '1' : '0' };
                return { type: 'text', value: String(arg) };
            });

            const body = {
                requests: [
                    { type: 'execute', stmt: { sql, args: formattedArgs } },
                    { type: 'close' }
                ]
            };

            const endpoint = TURSO_URL.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '') + '/v2/pipeline';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TURSO_AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                throw new Error(`Turso HTTP Error: ${res.status}`);
            }

            const json = await res.json();
            const firstResult = json.results?.[0];
            if (firstResult?.type === 'error') {
                throw new Error(firstResult.error?.message || 'Turso query error');
            }

            const execResult = firstResult?.response?.result;
            if (!execResult) return { rows: [], affectedRows: 0 };

            const cols = execResult.cols.map(c => c.name);
            const rows = execResult.rows.map(row => {
                const obj = {};
                row.forEach((cell, idx) => {
                    const colName = cols[idx];
                    let val = cell.value;
                    if (cell.type === 'integer') val = parseInt(val, 10);
                    else if (cell.type === 'float') val = parseFloat(val);
                    else if (cell.type === 'null') val = null;
                    obj[colName] = val;
                });
                return obj;
            });

            return { rows, affectedRows: execResult.affected_row_count || 0 };
        }

        async function hashPassword(pass) {
            const encoder = new TextEncoder();
            const data = encoder.encode(pass);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async function verifyAdminPass(pass) {
            if (!pass) return false;
            const passHash = await hashPassword(pass);
            const { rows } = await queryTurso('SELECT admin_password_hash FROM portfolio_config WHERE id = 1 LIMIT 1');
            const storedHash = rows[0]?.admin_password_hash;
            if (storedHash) {
                return storedHash === passHash;
            } else {
                await queryTurso(
                    'INSERT INTO portfolio_config (id, admin_password_hash) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET admin_password_hash = excluded.admin_password_hash',
                    [passHash]
                );
                return true;
            }
        }

        try {
            // GET /api/projects
            if (path === '/api/projects' && request.method === 'GET') {
                const { rows } = await queryTurso('SELECT * FROM portfolio_projects ORDER BY id DESC');
                return new Response(JSON.stringify({ success: true, projects: rows }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // GET /api/status
            if (path === '/api/status' && request.method === 'GET') {
                const { rows } = await queryTurso('SELECT content FROM portfolio_status WHERE id = 1 LIMIT 1');
                const content = rows[0]?.content || 'Kiber Təhlükəsizlik öyrənirəm';
                return new Response(JSON.stringify({ success: true, status: content }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // POST /api/contact
            if (path === '/api/contact' && request.method === 'POST') {
                const payload = await request.json();
                const { name, contact, message } = payload;
                if (!name || !message) {
                    return new Response(JSON.stringify({ success: false, error: 'Name and message required' }), {
                        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                await queryTurso(
                    'INSERT INTO portfolio_messages (name, contact, message) VALUES (?, ?, ?)',
                    [name, contact || '', message]
                );

                const { rows } = await queryTurso('SELECT discord_webhook FROM portfolio_config WHERE id = 1 LIMIT 1');
                const webhook = rows[0]?.discord_webhook;

                return new Response(JSON.stringify({ success: true, webhook }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // POST /api/admin/login
            if (path === '/api/admin/login' && request.method === 'POST') {
                const { password } = await request.json();
                const isValid = await verifyAdminPass(password);
                return new Response(JSON.stringify({ success: isValid }), {
                    status: isValid ? 200 : 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // POST /api/admin/status
            if (path === '/api/admin/status' && request.method === 'POST') {
                const { password, status } = await request.json();
                if (!(await verifyAdminPass(password))) {
                    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
                        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                await queryTurso(
                    'INSERT INTO portfolio_status (id, content) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP',
                    [status]
                );

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // POST /api/admin/project/add
            if (path === '/api/admin/project/add' && request.method === 'POST') {
                const { password, name, description, image_url, github_link, tags } = await request.json();
                if (!(await verifyAdminPass(password))) {
                    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
                        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const tagsStr = Array.isArray(tags) ? tags.join(', ') : (tags || '');
                await queryTurso(
                    'INSERT INTO portfolio_projects (name, description, image_url, github_link, tags) VALUES (?, ?, ?, ?, ?)',
                    [name, description, image_url || '', github_link || '', tagsStr]
                );

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // POST /api/admin/project/delete
            if (path === '/api/admin/project/delete' && request.method === 'POST') {
                const { password, name } = await request.json();
                if (!(await verifyAdminPass(password))) {
                    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
                        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                await queryTurso('DELETE FROM portfolio_projects WHERE name = ?', [name]);

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // POST /api/admin/messages
            if (path === '/api/admin/messages' && request.method === 'POST') {
                const { password } = await request.json();
                if (!(await verifyAdminPass(password))) {
                    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
                        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const { rows } = await queryTurso('SELECT * FROM portfolio_messages ORDER BY id DESC');
                return new Response(JSON.stringify({ success: true, messages: rows }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
                status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (err) {
            return new Response(JSON.stringify({ success: false, error: err.message }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};
