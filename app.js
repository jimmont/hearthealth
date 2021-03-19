/*
	$ deno run --inspect -A ./app.js

	* uses Deno (the .js/.ts runtime) available at https://deno.land/
	* the above runs this script, debugging with all permissions enabled
	* will log to stdout the url to open

	NOTE
	* this was made for specific local development/experimentation
	* it doesn't properly escape or handle untrusted input
	* the SQLITE library also hasn't been tested for handling input
	* this app essentially has not addressed security and trusts everyone
*/
import { serve } from "https://deno.land/std/http/server.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import * as pafs from "https://deno.land/std/path/mod.ts";

const port = 5000;
const db = new DB("./app.db");
const server = serve({ port });

console.log(`open http://localhost:${ port }/`);

for await (const req of server) {
	let headers = {}, status, body;
	try{
		let result = await route(req);
		status = result.status || 200;
		body = result.body;
		if(result.headers) Object.assign(headers, result.headers);
	}catch(err){
		const { message, stack } = err;
		status = 500;
		body = { error: {message, stack} };
	}
	if(typeof body === 'object' && !(body instanceof Deno.File)){
		body = JSON.stringify(body, false, '\t');
		headers['Content-Type'] = 'application/json; charset=utf-8';
	}
	console.log(`${ status } ${ req.method } ${ req.url }`);
	req.respond({ status, headers: new Headers(headers), body });
}

/*
	from a request, compose a likely response
*/
async function route(req){
	const url = new URL(req.url, 'http://'+req.headers.get('host'));

	let body = '', status = 200;
	const { pathname, searchParams, origin } = url;
	if(pathname.startsWith('/api')){
		return api(url, req);
	}else{
		// static files
		// '<any>/' => '<any>/index.html'
		// '<any(without.extension)>' => '<any>/index.html'
		const index = pathname.endsWith('/') ? 'index.html' : (!/[a-z0-9]+\.[a-z0-9]+$/i.test(pathname) ? '/index.html' : '');
		// resolve only: '/' => './' due to resolve(Deno.cwd(), '/root') => '/root'
		const path = pafs.resolve(Deno.cwd(), `.${ pathname }${ index }`);
		try{
			const reader = await Deno.open( path );
			body = reader;
		}catch(error){
			status = 404;
			body = `not found "${ url }"`;
		};
	};

	return { status, body };
}
/*
create - insert - POST 201, Location:<header-url/type/id>; 409 for conflict if exists
read - select - GET; 200 vs 404
update - update - PATCH/modify/partial or PUT/replace/whole 204/200 ok response; or 404 or 405 or 4xx?
elete - delete - DELETE; delete from table where id = 77; 200 or 404, 405 if category doesn't allow using method (vs id)
*/
async function api(url, req){
	const { pathname, searchParams } = url;
	// '/api/thing/id' => ["type", "id/specific one"]
	const [type, id, ...dirs] = pathname.substring(5).split('/');
	if(!type){
		return {status: 200, body: {pathname: '/api/$TYPE/$ID?option=value', TODO:'describe this for consumers'}};
	}
	const params = [...Array.from(searchParams)];
	if(id) params.push(["id", id]);
	const where = params.reduce((all, param)=>{
		const [key, val] = param;
		// TODO other operators beyond '=' assumes '=' when missing, and all for now
		if(/^[a-z][a-z0-9_]*[a-z0-9]$/.test(key)){
			if( key.endsWith('id') ){
				if(/^[A-Za-z0-9]+$/.test(val)){
					all.push(`${key} = '${ val }'`);
				}
			}else if(/^[A-Za-z0-9: ._-]+$/.test(val)){
			// TODO possible value?: '=THING' 'LIKE_THING' ... TODO
				all.push(`${key} = '${ val }'`);
			}
		}
		return all;
	}, []);
	// TODO vary by req.method and payload.... TODO
	const sql = `select * from ${ type }${ where.length ? ` where ${ where.join(' && ') }`: '' } limit 20`;

	const response = {status: 200, body: {sql}};
	return query(sql).then(result=>{
		const rows = Array.from(result.rows);
		Object.assign(response.body, {rows, cols: result.cols.map(col=>col.name)});
		return response;
	}).catch(result=>{
		// recover: TODO adjust status per errors
		response.status = 503;
		response.body.error = result.error;
		return response;
	});
}

function query(sql){
	return new Promise((resolve, reject)=>{
		const result = {sql, db, rows: null, error: undefined};
		try{
			const rows = db.query(sql);
			result.cols = rows.columns();
			result.rows = rows;
			resolve(result);
		}catch(error){
			result.error = error;
			reject(result);
		};
	});
}

