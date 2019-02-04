/* tslint:disable */
export enum Figure {Pulsar,Goose,}
export enum SurfaceMode {Finite,Torus,}
export enum Cell {Dead,Alive,}
export class World {
free(): void;

 set_mode(arg0: number): void;

 load_plaintext(arg0: number, arg1: number, arg2: string): void;

 load_figure(arg0: number, arg1: number, arg2: number): void;

 get_index(arg0: number, arg1: number): number;

 get(arg0: number, arg1: number): number;

 set_cell(arg0: number, arg1: number, arg2: number): void;

 generations(): number;

 set(arg0: number, arg1: number, arg2: number): void;

 clear(): void;

 toggle(arg0: number, arg1: number): void;

 cells(): number;

 alive_neighbors(arg0: number, arg1: number): number;

 tick(): void;

static  new(arg0: number, arg1: number): World;

 render(): string;

}
