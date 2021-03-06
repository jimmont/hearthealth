/*
	* this is a draft solution, attempting to solve both a formal design (ui and ux) problem
	* it also attempts to manage complexity, be clear, separate concerns and approachable by anyone with proficiency in CSS, HTML, JavaScript and the various related APIs available in evergreen browsers
	* it is my solution, without any transmitted use rights or guarantee, the problem posed is included as it was conveyed
	* feedback is welcome, reach me with any followup via www.jimmont.com, there's an email posted there
*/
import { LitElement, html, svg, css } from './litelement.js';

customElements.define('hh-user', class HHUser extends LitElement{
	static get styles(){
		return css`
			:host{position:relative;display:inline;}
			:slotted{font-weight:normal;}
			slot[name="source"]{color:var(--blue, #555);}
			slot[name="source"]::slotted(*){position:absolute;bottom:0;right:1em;}
		`;
	}
	static get properties(){
		return {
			users: {type: Array},
			user: {type: Object},
		}
	}
	constructor(){
		super();
		this.users = [];
		this.user = null;
		this.datamode = 'api';
	}
	selectUser(event){
		const index = Number(event.target.value);
		const user = this.users[ index ] || null;
		const detail = {user, index, datamode: this.datamode};
		this.user = isNaN(index) ? -1 : index;

		console.log(`now show chart for ${ index }`, user);
		// relay state change to all who listen
		self.dispatchEvent(new CustomEvent('user', {detail}));

		const url = new URL(location), name = user[1];
		if(url.searchParams.get('user') !== name){
			url.searchParams.set('user', name);
			history.pushState({}, document.title, url);
		}
	}
	fetchUser(res){
		this.users = res.rows;
		// TODO
		requestAnimationFrame(()=>{
			const url = new URL(location);
			const user = url.searchParams.get('user');
			if(user){
				console.warn('display user', user, url);
				const node = this.shadowRoot.querySelector(`option[title^="${ user }"]`);
				if(!node) return;
				const { parentNode } = node;
				parentNode.selectedIndex = node.index;
				parentNode.dispatchEvent(new Event('change'));
			}
		});

	}
	connectedCallback(){
		super.connectedCallback();
		fetch('/api/users/')
			.then(res=>res.json())
			.then(res=>{
				return this.fetchUser(res);
			})
			// try static files
			.catch(error=>{
				this.datamode = 'static';
			 	fetch('./data-users.json')
			 		.then(res=>res.json())
			 		.then(res=>{
			 			return this.fetchUser(res);
			 		})
			 		// TODO
			 		.catch(console.error);
			})
	}
	renderUsers(user, i){
		const [id, name] = user;
		return html`<option value="${ i }" title="${ name } ${ id }">${ name }</option>`;
	}
	render(data){
		return html`
<select @change=${ this.selectUser }>
	<option>people</option>
	${ this.users.map(this.renderUsers) }
</select>
`;
	}
});

customElements.define('hh-measurements', class HHMeasurements extends LitElement{
	static get styles(){
		return css`
			:host{display:block;min-height:300px;background-color:#fff;}
			h1,h2,h3,h4,h5,h6,p,slot,svg{margin:0 0 1em 0;padding:0;display:block;}
			svg{margin:1em 0 5rem 0;}

			.data text{opacity:0;}
			.label-background:not(:last-of-type) text{opacity:0;}
			[class^="label-"]:hover text,
			[class^="label-"].hover text
				{opacity:1;text-shadow:0px 0px 5px #fff;}
			polyline{fill:none;stroke-width:5px;opacity:0.3;}
			.body_fat polyline, polyline.body_fat{stroke:var(--blue);}
			.markers polyline{stroke-dasharray: 5, 8, 1, 30;stroke-width:1;}
			.markers .body_fat polyline{stroke-dasharray: 3, 5;}
			[class^="label-"]:hover polyline,
			[class^="label-"].hover polyline
				{opacity:1;}
			circle{opacity:0.6;stroke:transparent;stroke-width:4px;fill:var(--red);}
			[class^="label-"]:hover circle,
			[class^="label-"].hover circle
				{opacity:1;stroke:var(--red);}
			.markers .body_fat text,
			tspan.body_fat{fill:var(--blue);font-weight:bold;opacity:1;}
			.markers .heart_rate polyline,
			.heart_rate{stroke:var(--red);stroke-width:1;opacity:0.7;}
			.markers .heart_rate text,
			tspan.heart_rate{fill:var(--red);opacity:1;}
			.markers text,
			.index, .sub, .sup{font-size:0.7em;}
		`;
	}
	static get properties(){
		return {
			measurements: {type: Array},
			cols: {type: Array},
			size: {type: Object}
		}
	}
	constructor(){
		super();
		this.measurements = [];
		this.cols = [];
		this.updateUser = this.updateUser.bind(this);
		this.updateSize = this.updateSize.bind(this);

		// fix hovering on mobile, may be a better way for this TODO
		this.addEventListener('touchstart', this.hoverin);
		this.addEventListener('touchend', this.hoverout);
	}
	hoverout(event){
		// last touch
		if(!event.touches.length) this.querySelectorAll('.hover').forEach(node=>{ node.classList.remove('hover') })
	}
	hoverin(event){
		cancelAnimationFrame(this._hovering);

		const node = event.composedPath().find(node => (node.matches && node.matches('[class^="label-"]')));

		if(node){
			const parent = node.parentNode;
			const active = parent.querySelectorAll('.hover');
			this._hovering = requestAnimationFrame(()=>{
				if(active) active.forEach(node=>{ node.classList.remove('hover') })
				node.classList.add('hover');
			});
		}
		console.log(node, event.type, event.target, event.composedPath(), event.touches.length);
	}
	connectedCallback(){
		super.connectedCallback();
		self.addEventListener('user', this.updateUser);
		self.addEventListener('resize', this.updateSize);
	}
	disconnectedCallback(){
		super.disconnectedCallback();
		self.removeEventListener('user', this.updateUser);
		self.removeEventListener('resize', this.updateSize);
	}
	updateSize(){
		this.size = this.getClientRects();
	}
	updateUser(event){
		const {user, index, datamode} = event.detail;
		if(!user){
			return this.measurements = [];
		}
		const [id, name] = user;

		fetch(datamode == 'api' ? `/api/measurements?user_id=${ id }` : `./data-measurements-${ id }.json`)
			.then(res=>res.json())
			.then(res=>{
				console.log('TODO show chart',res);
				this.dataTransform(res);
				this.cols = res.cols;
				this.measurements = res.rows;
				this.data = res;
			})
			// TODO
			.catch(console.error)
			;
	}
	dataTransform(sql){
		const {cols, rows} = sql;
		// could be generalized more...
		rows.forEach(this.dataWithDate);
		rows.sort(this.dataByDate);
		return sql;
	}
	dataWithDate(row){
		const text = row[ 2 ];
		let date = new Date(text);
		if(isNaN(date)) date = new Date(0);
		row[2] = {date, text} 
	}
	dataByDate(a, b){
		const d = a[2].date - b[2].date;
		return d < 0 ? -1 : (d > 0 ? 1 : 0);
	}
	render(){
		const { measurements, cols } = this;

		this.updateSize();

		if(!measurements || !measurements.length) return html`...select a user to show (should be up top to the right)...this is a flow like an administrative view of users mixed up with what would be a specific user login flow, it seemed easiest for this small solution`;

		const [clientRects] = this.size;
		console.log(`render`, clientRects.width, clientRects.height, clientRects);

		const [id, user_id, ...colkeys] = cols;
		const width = Math.max(500, clientRects.width), height = Math.min(400, clientRects.height);
		const xcount = measurements.length;
		const xstep = width / xcount;
		const colwidth = width / xcount;
		const colheight = height / colkeys.length;

		let xincrement = 1;
		const xminstep = 20;
		// compute the ticks to label
		while(width * xincrement / xcount < xminstep){
			xincrement += 1;
		};

		// convert one range to another: [hr-brady <=40, hr-tachy >=100], hrconvert = height-range / (number-range);
		// then hrn = (hr - hrrange) * hrconvert; where hrn is a y or x or z coordinate
		const hrmin = 30, hrmax = 150, hrrange = hrmax - hrmin;
		// body fat %: very unusual to have 5% or lower, 50% is extreme so cap at that
		const bfmin = 5, bfmax = 50, bfrange = bfmax - bfmin;

		const hrticks = Array.from( new Set([hrmin, 60, 100, hrmax]) );

		/* bf essential 2-5M 10-13F
			athletes...fit 6-13...17M 14-20...24F
			average 	25-31F 18-24M
			obese 32+F 25+M
			*/
		const bfticks = Array.from( new Set([bfmin, 10, 20, 30, bfmax]) );

		return html`
<h3>${ measurements.length } measurements</h3>
<slot></slot>
${ svg`<svg viewBox="0 0 ${ width } ${ height }" style="overflow:visible;">
<g class="markers" style="transform: translate(0, ${height}px);">
${
hrticks.map(hr=>{
	let hry = -(height * ((hr - hrmin) / hrrange));

	return svg`
<g class="heart_rate" style="transform: translate(0, ${ hry - 1 });">
	<polyline points="0,${ hry } ${width},${ hry }" />
	<text x="0" y=${ hry }><tspan>${ hr.toFixed(0) }bpm</tspan></text>
</g>
	`;
})

}

${
bfticks.map(bf=>{
	let bfy = -(height * ((bf - bfmin) / bfrange));
	return svg`
<g class="body_fat" style="transform: translate(0, ${ bfy + 1 });">
	<polyline points="0,${ bfy } ${width},${ bfy }" />
	<text x="1em" y=${ bfy }><tspan dy="1em">${ bf.toFixed(0) }%</tspan></text>
</g>
	`;
})

}

</g>
<g class="data" style="transform: translate(0, ${height}px);">
${
// timezone TODO https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
measurements.map((item, i)=>{
	const [id, user_id, ...data] = item;
	const [time, kg, hr, peak, bf, area] = data;
	const x = (i * xstep).toFixed(0), y = (i * colheight).toFixed(3);
	const className = i % xincrement === 0 ? 'label-foreground':'label-background';

	// hr normal range = 50-100 bpm; above 100 to 200 is quite high, above 180 or so requires medical help; runners often 40-50 range
	// seems unrealistic to be alive with a heart rate near or below the minimum (in this scenario) so set those to the minimum with the real value available somehow
	let hry = -(height * ((Math.max(hr, hrmin) - hrmin) / hrrange));

	let bfy = -(height * ((Math.max(bf, bfmin) - bfmin) / bfrange));

	const anchor = x <= (width/2) ? 'start':'end';

	return svg`
<g style="transform: translate(${ x }px, 0);" class="${ className }" >
	<polyline class=hit_area points="5,20 5,${ -height }" style="stroke-width:15px;stroke:rgba(255,255,255,0);" />
	<polyline class=body_fat points="5,0 5,${ bfy }" />
	<text x=0 y=1em class=data_text  text-anchor=${ anchor }
			style="transform:translateY(calc(${ -height }px + 0.5rem));" >
		<tspan class=weight_kg>${ kg }kg</tspan>
		<tspan class=body_fat x=0 dy=1em>${ bf }%</tspan>
		<tspan class=heart_rate x=0 dy=1em>${ hr }bpm</tspan>
	</text>
	<text y="0.8em" text-anchor=${ anchor }>
		<tspan class="index">${(i+1)}</tspan>
		<tspan x=0 dy="1em">${ time.text }</tspan></tspan>
		<tspan x=0 dy=1em>${ peak } peaks</tspan>
		<tspan x=0 dy=1em>${ area }mm</tspan><tspan class=sup dy="-0.5em">2</tspan>
	</text>
	<circle class=heart_rate cx=5 cy=${ hry.toFixed(1) } r=3 data-n=${ hr }></circle>
</g>
	`;
})
}</g>

</svg>` }
		`;
	}
});
