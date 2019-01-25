/* tslint:disable */
export enum Cell {Dead,Alive,}
export class World {
free(): void;

 get_index(arg0: number, arg1: number): number;

 get(arg0: number, arg1: number): number;

 set(arg0: number, arg1: number, arg2: number): void;

 clear(): void;

 toggle(arg0: number, arg1: number): void;

 cells(): number;

 alive_neighbors(arg0: number, arg1: number): number;

 tick(): void;

static  new(arg0: number, arg1: number): World;

 render(): string;

}
