class Color
{
    r = 0;
    g = 0;
    b = 0;
    a = 0;

    constructor(r, g, b, a)
    {
	const color = r instanceof Array ? r
	      : r instanceof Color ? [r.r, r.g, r.b, r.a]
	      : [r, g, b, a];
	
	this.set(
	    color[0] ? color[0] : this.r,
	    color[1] ? color[1] : this.g,
	    color[2] ? color[2] : this.b,
	    color[3] ? color[3] : 255
	);
    }

    set(r, g, b, a)
    {
        this.r = r;
        this.g = g;
        this.b = b;
	this.a = a;
    }
}

class Cycle
{
    rate    = 0;
    reverse = 0;
    low     = 0;
    high    = 0;

    constructor(rate, reverse, low, high)
    {
	const cycle = rate instanceof Object ? rate
	      : rate instanceof Cycle ? rate
	      : {
		  rate: rate,
		  reverse: reverse,
		  low: low,
		  high: high
	      };

	this.rate    = cycle.rate;
	this.reverse = cycle.reverse;
	this.low     = cycle.low;
	this.high    = cycle.high;
    }
}

class Palette
{
    colors     = new Array(255);
    baseColors = new Array();
    cycles     = new Array();

    numColors = 0;
    numCycles = 0;

    static ENABLE_CYCLING  = true;
    static USE_BLEND_SHIFT = true;
    static PRECISION       = 100;
    static CYCLE_SPEED     = 280;
    
    constructor(colors, cycles)
    {
	for (const color of colors) {
	    this.baseColors.push(new Color(color));
	}
	
	for (const cycle of cycles) {
	    this.cycles.push(new Cycle(cycle));
	}
	
	this.numColors = this.baseColors.length;
	this.numCycles = this.cycles.length;
    }

    cycle(timeNow, settings)
    {
	Palette.COPY_COLORS(this.baseColors, this.colors);

	if (!Palette.ENABLE_CYCLING)
	    return;

	const {speedAdjust, blendShiftEnabled} = settings;

	for (const {rate, reverse, low, high} of this.cycles) {
	    let cycleAmount = 0;
		
	    if (rate) {
		const cycleSize = (high - low) + 1;
		const cycleRate = rate / Math.floor(Palette.CYCLE_SPEED / speedAdjust);

		if (reverse < 3) {
		    cycleAmount = Palette.DFLOAT_MOD(timeNow / (1000 / cycleRate), cycleSize);
		} else if (reverse === 3) {
		    cycleAmount = Palette.DFLOAT_MOD(timeNow / (1000 / cycleRate), 2 * cycleSize);
		    cycleAmount = cycleAmount >= cycleSize ? (2 * cycleSize) - cycleAmount : cycleAmount;
		} else if (reverse > 6) {
		    cycleAmount = DFLOAT_MOD((timeNow / (1000 / cycleRate)), cycleSize);
		    cycleAmount = Math.sin((2 * Math.PI * cycleAmount)/cycleSize) + 1;
		    cycleAmount = reverse === 4 ? cycleAmount * (cycleSize / 4) : cycleAmount;
		    cycleAmount = reverse === 5 ? cycleAmount * (cycleSize / 2) : cycleAmount;
		}
		
		if (reverse === 2)
		    Palette.REVERSE_COLORS(this.colors, low, high);
		
		if (Palette.USE_BLEND_SHIFT && blendShiftEnabled)
		    Palette.BLEND_SHIFT_COLORS(this.colors, low, high, cycleAmount);
		else
		    Palette.SHIFT_COLORS(this.colors, low, high, cycleAmount);

		if (reverse == 2)
		    Palette.REVERSE_COLORS(this.colors, low, high);
	    }
	}
    }

    burnOut(frame, max)
    {
        const amount = Math.floor(255 * (frame / max));
	
        for (let color of this.colors) {
	    color.r = color.r < 0 ? 0 : color.r - amount;
	    color.g = color.g < 0 ? 0 : color.g - amount;
	    color.b = color.b < 0 ? 0 : color.b - amount;
	}
    }
    
    static COPY_COLORS(src, dst)
    {
	for (let i = 0; i < src.length; i += 1) {
	    if (!(dst[i] instanceof Color))
		dst[i] = new Color(src);

	    const {r, g, b, a} = src[i];
            dst[i].set(r, g, b, a);
	}
    }
    
    static REVERSE_COLORS(colors, low, high)
    {
	const cycleSize = (high - low) + 1;

	for (let i = 0; i < cycleSize/2; i += 1)
	    Palette.SWAP_COLORS(colors[low + i], colors[high - i]);
    }
    
    static SHIFT_COLORS(colors, low, high, amount)
    {
	for (let i = 0; i < Math.floor(amount); i += 1) {
	    let temp = colors[high];

	    for (let j = high - 1; j >= low; j -= 1)
		colors[j + 1] = colors[j];

	    colors[low] = temp;
	}
    }
	
    static BLEND_SHIFT_COLORS(colors, low, high, amount)
    {
	// shift colors using BlendShift (fade colors creating a smooth transition)
	// BlendShift Technology conceived, designed and coded by Joseph Huckaby

	Palette.SHIFT_COLORS(colors, low, high, amount);

	const frame = Math.floor((amount - Math.floor(amount)) * Palette.PRECISION);

	let temp = colors[high];
	for (let j = high - 1; j >= low; j -= 1)
		colors[j + 1] = Palette.FADE_COLOR(colors[j + 1], colors[j], frame, Palette.PRECISION);

	colors[low] = Palette.FADE_COLOR(colors[low], temp, frame, Palette.PRECISION);
    }
    
    static FADE_COLOR(srcColor, dstColor, frame, max)
    {
	// fade one color into another by a partial amount, return new color in between

	if (!max) return sourceColor; // avoid divide by zero
	if (frame < 0) frame = 0;
	if (frame > max) frame = max;

	return new Color(
	    Math.floor(srcColor.r + (((dstColor.r - srcColor.r) * frame) / max) ),
	    Math.floor(srcColor.g + (((dstColor.g - srcColor.g) * frame) / max) ),
	    Math.floor(srcColor.b + (((dstColor.b - srcColor.b) * frame) / max) )
	);
    }

    static SWAP_COLORS = (a, b) => (a, b = b, a);
    
    static DFLOAT_MOD = (a, b) => ((Math.floor(a*Palette.PRECISION) % Math.floor(b*Palette.PRECISION))/Palette.PRECISION);
}

class Tween
{
    static tweens = new Array();
    static nextId = 0;

    id = 0;

    clockStart = 0;

    onUpdate = null;
    onComplete = null;

    target = new Object();
    properties = new Object();

    algrothim = null;
    mode = null;
    
    constructor(opt)
    {	
	this.duration = opt.duration;

	this.algorthim = opt.algorthim;
	
	this.mode = opt.mode;

	this.target = opt.target;

	this.properties = opt.properties;

	this.onUpdate = opt.onUpdate;

	this.onComplete = opt.onComplete;
    }

    step(clock)
    {
	if (this.destroyed)
	    return;
	
	this.clockStart = this.clockStart === 0 ? clock : this.clockStart;

	let amount = (clock - this.clockStart) / this.duration

	if (!this.destroyed && amount >= 1.0) {
	    amount = 1.0;
            this.destroyed = true;
	}

	for (const prop in this.properties) {
	    //const value = this.clockStart + Tween.ease(amount, this.mode, this.algorthim) * (this._prop.end - this.prop.start);

	    const value = Tween.ease(amount, this.mode, this.algorthim) * this.properties[prop];

	    this.target[prop] = value;
	}
	
	if (this.onUpdate instanceof Function)
	    this.onUpdate(this);

	if (this.destroyed) {
	    if (this.onComplete instanceof Function)
		this.onComplete(this);
	}
    }

    static EaseAlgos = {
        Linear:    amount => amount,
	Quadratic: amount => Math.pow(amount, 2),
	Cubic:     amount => Math.pow(amount, 3),
	Quartetic: amount => Math.pow(amount, 4),
	Quintic:   amount => Math.pow(amount, 5),
	Sine:      amount => (1 - Math.sin((1 - amount) * Math.PI / 2)),
	Circular:  amount => (1 - Math.sin(Math.acos(amount))),
    }

    static EaseModes = {
        EaseIn:    (amount, algo) => Tween.EaseAlgos[algo](amount),
	EaseOut:   (amount, algo) => (1 - Tween.EaseAlgos[algo](1 - amount)),
	EaseInOut: (amount, algo) => ((amount <= 0.5) ? Tween.EaseAlgos[algo](2 * amount) / 2 : (2 - Tween.EaseAlgos[algo](2 * (1 - amount))) / 2),
    }

    static ease = (amount, mode, algo) => Tween.EaseModes[mode](amount, algo);
    
    static step = clock => Tween.tweens.forEach(tween => tween.step(clock));

    static create = opt =>
    {
	const tween = new Tween(opt);

	tween.id = Tween.nextId;

	Tween.tweens[Tween.nextId] = tween;
	
	Tween.nextId += 1;

	return tween;
    }
}

function Result(callback, errCallback)
{
    if (!(callback instanceof Function))
	return [null, null];
	
    const [result, error] = (() => {
        try {
	    return [callback(), null];
        } catch (error) {
	    if (errCallback !== undefined)
		errCallback(error);
	    
	    return [null, error];
	}
    })();

    if (result instanceof Promise) {
        return new Promise(async (resolve) => {
	    try {
	        resolve([await result, null]);
	    } catch (error) {
                if (errCallback !== undefined)
		    errCallback(error);
	    
	        resolve([null, error]);
	    }
        });
    }
    
    return [result, error];
}

export default class CanvasCycle
{
    title = null;
    
    context = null;

    device = null;
    format = null;
    pipeline = null;
    encoder = null;
    
    palette = null;
    pixels = null;
    img = null;
    
    running = false;
    
    settings = {
	targetFPS: 60,
	blendShiftEnabled: true,
        speedAdjust: 1.0,
    }
    
    sceneIndex = 0;
    scenes = new Array();

    cache = new Map();
    
    static globalBrightness = 1.0;

    constructor()
    {
	const head = document.head;

	const shaders = (() => {
	    for (const element of head.children) {
	        if (element.tagName === "TITLE")
		    this.title = element;

		if (element.type === "application/json")
		    this.scenes = JSON.parse(element.textContent).scenes;
		    
		    
	        if (element.type === "text/wgsl")
		    return element.textContent;
	    }
	})();

	return new Promise(async resolve => {
	    const adapter = await navigator.gpu.requestAdapter();
            this.device = await adapter.requestDevice();
            this.format = navigator.gpu.getPreferredCanvasFormat(); 

	    const shaderModule = this.device.createShaderModule({ code: shaders });	

	    const vs = { module: shaderModule };
	    const fs = { module: shaderModule, targets: [{ format: this.format }] };
	
            const pipelineDescriptor = { layout: "auto", vertex: vs, fragment: fs, primitive: { topology: "triangle-list" } };

	    this.pipeline = this.device.createRenderPipeline(pipelineDescriptor);

	    resolve(this);
	});
    }
    
    run()
    {
	if (!this.running) {
	    this.running = true;
	    requestAnimationFrame(timestamp => this.animate(timestamp, timestamp));
	}
    }

    animate(timestamp, timestart)
    {
	const encoder = this.device.createCommandEncoder();

	const tickCount = Math.floor(timestamp - timestart);

	Tween.step(tickCount);

	this.palette.cycle(tickCount, this.settings);

	if (CanvasCycle.globalBrightness < 1.0) {
	    this.palette.burnOut(1.0 - CanvasCycle.globalBrightness, 1.0);
	}

	this.renderImage(encoder);

	this.device.queue.submit([encoder.finish()]);	

	if (this.running) {
	    requestAnimationFrame(timestamp => this.animate(timestamp, timestart));
	}
    }
    
    async init()
    {
	window.addEventListener("popstate", ({state}) => {
	    this.sceneIndex = state.sceneIndex;
	    this.switchScene(this.scenes[this.sceneIndex]);
	});
	
	const searchParams = new URLSearchParams(window.location.search);

	this.sceneIndex = searchParams.has("sceneIndex") ? +searchParams.get("sceneIndex") : Math.floor(Math.random() * this.scenes.length);

	const url = new URL(window.location);
	
	window.history.pushState({ sceneIndex: this.sceneIndex }, "", url);

	if (this.scenes[this.sceneIndex] === undefined) {
	    this.sceneIndex = 0;

	    url.searchParams.set("sceneIndex", this.sceneIndex);

	    window.history.pushState({}, "", url);
	}

	const container = document.body.children[0];

	container.setAttribute("class", "container");

	const overlay = document.createElement("div");

	overlay.setAttribute("class", "overlay");
	
	const imgList = new Array(this.scenes.length);

	for (let i = 0; i < this.scenes.length; i += 1) {
	    const image = this.scenes[i];

            const img = document.createElement("img");

	    imgList[i] = img;

	    img.setAttribute("class", "item");
	  
	    img.setAttribute("src",    `./images/${image.src}.webp`);
	    img.setAttribute("width",  320);
	    img.setAttribute("height", 240);

	    if (this.sceneIndex < this.scenes.length && (this.sceneIndex + 1) === i) {
		img.classList.add("next-item");
	    } else if (this.sceneIndex >= 0 && (this.sceneIndex - 1) === i) {
		img.classList.add("prev-item");
	    }
	     
	    img.addEventListener("click", () => {
		imgList[i] = img;
		
		this.sceneIndex = i;
		this.switchScene(this.scenes[this.sceneIndex]);

		if (img.classList.contains("next-item")) {
		    img.classList.remove("next-item");
		    
		    if (this.scenes.length - i > 1)
		        imgList[i + 1].classList.add("next-item");

		    if (i >= 2)
		        imgList[i - 2].classList.remove("prev-item");

		    imgList[i - 1].classList.add("prev-item");
		} else if (img.classList.contains("prev-item")) {
		    img.classList.remove("prev-item");

		    if (i >= 1)
		        imgList[i - 1].classList.add("prev-item");

		    if (this.scenes.length - i > 2)
		        imgList[i + 2].classList.remove("next-item");

		    imgList[i + 1].classList.add("next-item");
		}
		
		url.searchParams.set("sceneIndex", this.sceneIndex);

	        window.history.pushState({ sceneIndex: this.sceneIndex }, "", url);
	    });

	    //overlay.appendChild(img);
	}

	const grid = document.createElement("div");

	grid.setAttribute("class", "grid");

	grid.style.setProperty("grid-template-columns", "auto" + " auto".repeat(6));

	for (let i = 0; i < this.scenes.length; i += 1) {
	    const scene = this.scenes[i];
	    
	    const div = document.createElement("div");

	    const p = document.createElement("p");

	    p.innerHTML = scene.title;
	    
            const img = document.createElement("img");
	    
	    img.setAttribute("src",    `./images/${scene.src}.webp`);
	    img.setAttribute("width",  80);
	    img.setAttribute("height", 60);
	    	     
	    img.addEventListener("click", () => {		
		this.sceneIndex = i;
		this.switchScene(this.scenes[this.sceneIndex]);

		url.searchParams.set("sceneIndex", this.sceneIndex);

	        window.history.pushState({ sceneIndex: this.sceneIndex }, "", url);
	    });

	    div.appendChild(img);
	    //div.appendChild(p);

	    //grid.appendChild(div);
	}
	
	overlay.appendChild(grid);

	const next = document.createElement("button");

	next.innerHTML = ">";
	
	next.addEventListener("click", () => {
	    this.sceneIndex = (this.sceneIndex + 1) < this.scenes.length ? this.sceneIndex + 1 : 0;
	    this.switchScene(this.scenes[this.sceneIndex]);

	    url.searchParams.set("sceneIndex", this.sceneIndex);

	    window.history.pushState({ sceneIndex: this.sceneIndex }, "", url);
	});
	
	const prev = document.createElement("button");

	prev.innerHTML = "<";
	
	prev.addEventListener("click", () => {
	    this.sceneIndex = (this.sceneIndex - 1) >= 0 ? this.sceneIndex - 1 : this.scenes.length - 1;
	    this.switchScene(this.scenes[this.sceneIndex]);

	    url.searchParams.set("sceneIndex", this.sceneIndex);

	    window.history.pushState({ sceneIndex: this.sceneIndex }, "", url);
	});

	const canvas = document.createElement("canvas");
  
	canvas.width = 640;
	canvas.height = 480;

	canvas.addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen() : canvas.requestFullscreen());
	
	//container.appendChild(prev);
	container.appendChild(canvas);
	//container.appendChild(next);
	container.appendChild(overlay);
	
        this.context = canvas.getContext("webgpu");

	this.context.configure({ device: this.device, format: this.format, alphaMode: "premultiplied" })
	
	await this.loadImage(this.scenes[this.sceneIndex]);
    }
    
    async loadImage(image)
    {
	const [result] = this.cache.has(image.src) ? [this.cache.get(image.src), null] : await new Result(async () => {
	    const response = await fetch(`./images/${image.src}.json`);
	    return await response.clone().json();
	});
	
	if (result) {
	    this.cache.set(image.src, result);
	    this.processImage(result);
	    this.title.innerHTML = `Canvas Cycle: ${image.title}`;
	}
    }

    processImage(image)
    {
	const { colors, cycles, pixels, width, height } = image;

	this.pixels = pixels;

	this.palette = new Palette(colors, cycles);
	
	const data = new Uint8ClampedArray(4 * width * height);

	for (let i = 0; i < pixels.length; i += 1) {
	    const {r, g, b, a} = new Color(colors[pixels[i]]);
	
	    data[4 * i + 0] = r;
	    data[4 * i + 1] = g;
	    data[4 * i + 2] = b;
	    data[4 * i + 3] = a;
	}

	this.img = new ImageData(data, width, height, {pixelFormat: "rgba-unorm8"});

        Tween.create({
	    mode: "EaseInOut",
            algorthim: "Quadratic",
            properties: { value: 1.0 },
	    target: { value: 0.0 },
	    duration: 1000,
            onUpdate: tween => (CanvasCycle.globalBrightness = tween.target.value),
        });	    

	this.run();
    }

    switchScene(index)
    {
	Tween.create({
	    mode: "EaseInOut",
            algorthim: "Quadratic",
            properties: { value: 1.0 },
	    target: { value: 0.0 },
	    duration: 1000,
            onUpdate: tween => (CanvasCycle.globalBrightness = 1.0 - tween.target.value),
	    onComplete: tween => (this.loadImage(index)),
        });
    }
    
    renderImage(encoder)
    {
	{
	    const pixels = this.pixels;

	    const { width, height } = this.img;
	    
	    const { colors } = this.palette;
            
	    const data = new Uint8ClampedArray(4 * width * height);

	    for (let i = 0; i < pixels.length; i += 1) {
	        const color = new Color(colors[pixels[i]]);
		
	        data[4 * i + 0] = color.r;
	        data[4 * i + 1] = color.g;
	        data[4 * i + 2] = color.b;
	        data[4 * i + 3] = color.a;
	    }
	   
	    this.img = new ImageData(data, width, height, {pixelFormat: "rgba-unorm8"});
	}
	
	const texture = this.device.createTexture({
	    size: [this.img.width, this.img.height],
	    format: "rgba8unorm",
	    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
	});
	
        this.device.queue.writeTexture(
	    {texture},
	    this.img.data,
	    {bytesPerRow: 4 * this.img.width},
	    {width: this.img.width, height: this.img.height},
	);
	
        const sampler = this.device.createSampler();

	const bindGroup = this.device.createBindGroup({
	    layout: this.pipeline.getBindGroupLayout(0),
	    entries: [
		{binding: 0, resource: sampler},
	    	{binding: 1, resource: texture},
	    ],
	});

	const view = this.context.getCurrentTexture().createView();
	
	const renderPassDescriptor = { colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: "clear", storeOp: "store", view: view }] };

        const passEncoder = encoder.beginRenderPass(renderPassDescriptor);

	passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(6);
        passEncoder.end();
    }
    
    async exportImageJSON()
    {
	const colors = new Array(this.palette.colors.length);

	for (let i = 0; i < colors.length; i += 1) {
	    const {r, g, b} = this.palette.colors[i];
	    colors[i] = [r, g, b];
	}
	
	const cycles = new Array(this.palette.cycles.length);

	for (let i = 0; i < cycles.length; i += 1) {
	    const {rate, reverse, low, high} = this.palette.cycles[i];
	    cycles[i] = { rate: rate, reverse: reverse, low: low, high: high };
	}
	
	const data = {
	    pixels: this.pixels,
	    colors: colors,
	    cycles: cycles,
	    width:  this.img.width,
	    height: this.img.height,
	};
	
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });

	const blobUrl = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = blobUrl;
	a.download = this.scenes[this.sceneIndex].src;
	a.click();
	
	//window.open(URL.createObjectURL(blob), '_blank');
    }
    
    async exportImage()
    {
	const bmp = await createImageBitmap(this.img);

	const canvas = new OffscreenCanvas(bmp.width, bmp.height)

	const context = canvas.getContext('bitmaprenderer');

	context.transferFromImageBitmap(bmp);
	
        const blob = await canvas.convertToBlob({ type: 'image/webp' });

	const blobUrl = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = blobUrl;
	a.download = this.scenes[this.sceneIndex].src;
	a.click();
	
        //window.open(URL.createObjectURL(blob), '_blank');
    }
}
