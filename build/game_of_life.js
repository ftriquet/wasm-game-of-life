(function() {
    var wasm;
    const __exports = {};
    /**
    */
    __exports.Figure = Object.freeze({ Pulsar:0,Goose:1, });
    /**
    */
    __exports.SurfaceMode = Object.freeze({ Finite:0,Torus:1, });
    /**
    */
    __exports.Cell = Object.freeze({ Dead:0,Alive:1, });

    let cachedTextEncoder = new TextEncoder('utf-8');

    let cachegetUint8Memory = null;
    function getUint8Memory() {
        if (cachegetUint8Memory === null || cachegetUint8Memory.buffer !== wasm.memory.buffer) {
            cachegetUint8Memory = new Uint8Array(wasm.memory.buffer);
        }
        return cachegetUint8Memory;
    }

    let WASM_VECTOR_LEN = 0;

    function passStringToWasm(arg) {

        const buf = cachedTextEncoder.encode(arg);
        const ptr = wasm.__wbindgen_malloc(buf.length);
        getUint8Memory().set(buf, ptr);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let cachedTextDecoder = new TextDecoder('utf-8');

    function getStringFromWasm(ptr, len) {
        return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len));
    }

    let cachedGlobalArgumentPtr = null;
    function globalArgumentPtr() {
        if (cachedGlobalArgumentPtr === null) {
            cachedGlobalArgumentPtr = wasm.__wbindgen_global_argument_ptr();
        }
        return cachedGlobalArgumentPtr;
    }

    let cachegetUint32Memory = null;
    function getUint32Memory() {
        if (cachegetUint32Memory === null || cachegetUint32Memory.buffer !== wasm.memory.buffer) {
            cachegetUint32Memory = new Uint32Array(wasm.memory.buffer);
        }
        return cachegetUint32Memory;
    }

    __exports.__wbg_error_cc95a3d302735ca3 = function(arg0, arg1) {
        let varg0 = getStringFromWasm(arg0, arg1);

        varg0 = varg0.slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);

        console.error(varg0);
    };

    function freeWorld(ptr) {

        wasm.__wbg_world_free(ptr);
    }
    /**
    */
    class World {

        static __wrap(ptr) {
            const obj = Object.create(World.prototype);
            obj.ptr = ptr;

            return obj;
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;
            freeWorld(ptr);
        }

        /**
        * @param {number} arg0
        * @returns {void}
        */
        set_mode(arg0) {
            return wasm.world_set_mode(this.ptr, arg0);
        }
        /**
        * @param {number} arg0
        * @param {number} arg1
        * @param {string} arg2
        * @returns {void}
        */
        load_plaintext(arg0, arg1, arg2) {
            const ptr2 = passStringToWasm(arg2);
            const len2 = WASM_VECTOR_LEN;
            return wasm.world_load_plaintext(this.ptr, arg0, arg1, ptr2, len2);
        }
        /**
        * @param {number} arg0
        * @param {number} arg1
        * @param {number} arg2
        * @returns {void}
        */
        load_figure(arg0, arg1, arg2) {
            return wasm.world_load_figure(this.ptr, arg0, arg1, arg2);
        }
        /**
        * @param {number} arg0
        * @param {number} arg1
        * @returns {number}
        */
        get_index(arg0, arg1) {
            return wasm.world_get_index(this.ptr, arg0, arg1);
        }
        /**
        * @param {number} arg0
        * @param {number} arg1
        * @returns {number}
        */
        get(arg0, arg1) {
            return wasm.world_get(this.ptr, arg0, arg1);
        }
        /**
        * @param {number} arg0
        * @param {number} arg1
        * @param {number} arg2
        * @returns {void}
        */
        set_cell(arg0, arg1, arg2) {
            return wasm.world_set_cell(this.ptr, arg0, arg1, arg2);
        }
        /**
        * @returns {number}
        */
        generations() {
            return wasm.world_generations(this.ptr);
        }
        /**
        * @param {number} arg0
        * @param {number} arg1
        * @param {number} arg2
        * @returns {void}
        */
        set(arg0, arg1, arg2) {
            return wasm.world_set(this.ptr, arg0, arg1, arg2);
        }
        /**
        * @returns {void}
        */
        clear() {
            return wasm.world_clear(this.ptr);
        }
        /**
        * @param {number} arg0
        * @param {number} arg1
        * @returns {void}
        */
        toggle(arg0, arg1) {
            return wasm.world_toggle(this.ptr, arg0, arg1);
        }
        /**
        * @returns {number}
        */
        cells() {
            return wasm.world_cells(this.ptr);
        }
        /**
        * @param {number} arg0
        * @param {number} arg1
        * @returns {number}
        */
        alive_neighbors(arg0, arg1) {
            return wasm.world_alive_neighbors(this.ptr, arg0, arg1);
        }
        /**
        * @returns {void}
        */
        tick() {
            return wasm.world_tick(this.ptr);
        }
        /**
        * @param {number} arg0
        * @param {number} arg1
        * @returns {World}
        */
        static new(arg0, arg1) {
            return World.__wrap(wasm.world_new(arg0, arg1));
        }
        /**
        * @returns {string}
        */
        render() {
            const retptr = globalArgumentPtr();
            wasm.world_render(retptr, this.ptr);
            const mem = getUint32Memory();
            const rustptr = mem[retptr / 4];
            const rustlen = mem[retptr / 4 + 1];

            const realRet = getStringFromWasm(rustptr, rustlen).slice();
            wasm.__wbindgen_free(rustptr, rustlen * 1);
            return realRet;

        }
    }
    __exports.World = World;

    __exports.__wbindgen_throw = function(ptr, len) {
        throw new Error(getStringFromWasm(ptr, len));
    };

    function init(path_or_module) {
        let instantiation;
        const imports = { './game_of_life': __exports };
        if (path_or_module instanceof WebAssembly.Module) {
            instantiation = WebAssembly.instantiate(path_or_module, imports)
            .then(instance => {
            return { instance, module: path_or_module }
        });
    } else {
        const data = fetch(path_or_module);
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            instantiation = WebAssembly.instantiateStreaming(data, imports);
        } else {
            instantiation = data
            .then(response => response.arrayBuffer())
            .then(buffer => WebAssembly.instantiate(buffer, imports));
        }
    }
    return instantiation.then(({instance}) => {
        wasm = init.wasm = instance.exports;

    });
};
self.gameOfLife = Object.assign(init, __exports);
})();
