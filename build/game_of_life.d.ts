/* tslint:disable */
export enum SurfaceMode {Finite,Torus,}
export enum Cell {Dead,Alive,}
export class World {
free(): void;

 load_string(arg0: string): string;

 set_mode(arg0: number): void;

 set_cell(arg0: number, arg1: number, arg2: number): void;

 generations(): number;

 clear(): void;

 toggle(arg0: number, arg1: number): void;

 cells(): number;

 changed_cells(): number;

 changed_cells_len(): number;

 reset_changed_cells(): void;

 tick(): void;

static  new(arg0: number, arg1: number): World;

}
