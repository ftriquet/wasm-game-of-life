#![feature(custom_attribute)]
#![allow(dead_code)]
#![allow(unused_attributes)]

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use console_error_panic_hook;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);
}

use crate::Cell::*;
const PULSAR: [Cell; 195] = include!("../patterns/pulsar");
const PULSAR_ROWS: usize = 13;
const PULSAR_COLS: usize = 15;

const GOOSE: [Cell; 156] = include!("../patterns/goose");
const GOOSE_ROWS: usize = 12;
const GOOSE_COLS: usize = 13;

const GLIDER_GUN: [Cell; 324] = include!("../patterns/glider_gun");
const GLIDER_GUN_ROWS: usize = 9;
const GLIDER_GUN_COLS: usize = 36;

const BI_GUN: [Cell; 750] = include!("../patterns/bi_gun");
const BI_GUN_ROWS: usize = 15;
const BI_GUN_COLS: usize = 50;


#[wasm_bindgen]
#[derive(Clone, Copy)]
pub enum Figure {
    Pulsar,
    Goose,
    GliderGun,
    BiGun,
}

impl Figure {
    pub fn data(self) -> (usize, usize, &'static [Cell]) {
        match self {
            Figure::Pulsar => (PULSAR_ROWS, PULSAR_COLS, &PULSAR),
            Figure::Goose => (GOOSE_ROWS, GOOSE_COLS, &GOOSE),
            Figure::GliderGun => (GLIDER_GUN_ROWS, GLIDER_GUN_COLS, &GLIDER_GUN),
            Figure::BiGun => (BI_GUN_ROWS, BI_GUN_COLS, &BI_GUN),
        }
    }
}

#[wasm_bindgen]
pub enum SurfaceMode {
    Finite,
    Torus
}

#[wasm_bindgen]
pub struct World {
    width: i32,
    height: i32,
    cells: Vec<Cell>,
    cache: Vec<Cell>,
    mode: SurfaceMode,
    generations: u32,
    changed_cells: Vec<i32>,
}


#[repr(C)]
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

impl ::std::convert::From<char> for Cell {
    fn from(c: char) -> Self {
        match c {
            '.' => Cell::Dead,
            'o' | 'O' => Cell::Alive,
            _ => {
                panic!("Invalid character: {}", c)
            }
        }
    }
}

#[wasm_bindgen]
impl World {
    pub fn set_mode(&mut self, mode: SurfaceMode) {
        self.mode = mode;
    }

    pub fn load_figure(&mut self, row: i32, col: i32, figure: Figure) {
        let (rows, cols, data) = figure.data();
        let mut data = data.iter().cloned();
        for i in 0..rows {
            for j in 0..cols {
                let current_cell = data.next().expect("Invalid figure size constant");
                self.set_cell(row + i as i32, col + j as i32, current_cell);
            }
        }
    }

    #[inline(always)]
    fn get_index(&self, mut row: i32, mut col: i32) -> i32 {
        if row < 0 { row = self.height + row };
        if col < 0 { col = self.width + col };
        let col = col % self.width;
        let row = row % self.height;
        (row * self.width + col)
    }

    #[inline(always)]
    fn get(&self, row: i32, col: i32) -> Cell {
        self.cells[self.get_index(row, col) as usize]
    }

    #[inline(always)]
    pub fn set_cell(&mut self, row: i32, col: i32, t: Cell) {
        let idx = self.get_index(row, col);
        self.changed_cells.push(idx);
        let idx = idx as usize;
        self.cells[idx] = t;
    }

    pub fn generations(&self) -> u32 {
        self.generations
    }

    #[inline(always)]
    fn set(&mut self, row: i32, col: i32, t: Cell) {
        let idx = self.get_index(row, col) as usize;
        self.cache[idx] = t;
    }

    pub fn clear(&mut self) {
        self.cells.iter_mut().for_each(|cell| *cell = Cell::Dead);
        self.reset_changed_cells();
    }

    pub fn toggle(&mut self, row: i32, col: i32) {
        let idx = self.get_index(row, col);
        self.changed_cells.push(idx);
        let idx = idx as usize;
        self.cells[idx] = match self.cells[idx] {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead
        }
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    fn alive_neighbors(&self, row: i32, col: i32) -> u8 {
        let check_out_of_bounds = |r, c| {
            match self.mode {
                SurfaceMode::Torus => {
                    self.get(row + r, col + c) as u8
                },
                SurfaceMode::Finite => {
                    if row + r >= 0 && row + r < self.height &&
                        col + c >= 0 && col + c < self.width {
                            self.get(row + r, col + c) as u8
                        } else {
                            0
                        }
                }
            }
        };
        let indexes = [
            (-1, -1),
            (-1, 0),
            (-1, 1),
            (0, -1),
            (0, 1),
            (1, -1),
            (1, 0),
            (1, 1),
        ];
        indexes
            .into_iter()
            .map(|(r, c)| check_out_of_bounds(r, c))
            .sum()
    }

    pub fn changed_cells(&mut self) -> *const i32 {
        self.changed_cells.as_ptr()
    }

    pub fn changed_cells_len(&self) -> usize {
        self.changed_cells.len()
    }

    pub fn reset_changed_cells(&mut self) {
        self.changed_cells.clear();
    }

    pub fn tick(&mut self) {
        for row in 0..self.height {
            for col in 0..self.width {
                let cell = self.get(row, col);
                let alive_neighbors = self.alive_neighbors(row, col);
                // Alive cell with 2 or 3 alive neighbors stays alive
                // Dead cell with exactly 3 neighbors borns.
                // Other cells die fomr over or under population.
                let next_cell = match (cell, alive_neighbors) {
                    (Cell::Alive, 2) | (_, 3) => Cell::Alive,
                    _ => Cell::Dead,
                };
                if cell != next_cell {
                    self.changed_cells.push(self.get_index(row, col));
                }
                self.set(row, col, next_cell);
            }
        }
        self.generations += 1;

        ::std::mem::swap(&mut self.cells, &mut self.cache);
    }

    pub fn new(width: i32, height: i32) -> World {
        console_error_panic_hook::set_once();

        let data = vec![Cell::Dead; (width * height) as usize];

        World {
            width,
            height,
            cells: data.clone(),
            cache: data,
            mode: SurfaceMode::Finite,
            generations: 0,
            changed_cells: Vec::new(),
        }
    }
}
