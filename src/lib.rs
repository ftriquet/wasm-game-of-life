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

fn parse_plaintext(s: &str) -> Pattern {
    let width = s.lines().next().unwrap().len();
    let height = s.lines().count();
    let cells = s.chars().filter(|&c| c != '\n').map(|c| {
        Cell::from(c)
    }).collect::<Vec<_>>();

    Pattern {
        width: width as i32,
        height: height as i32,
        cells
    }
}

#[derive(Debug)]
pub struct Pattern {
    width: i32,
    height: i32,
    cells: Vec<Cell>,
}

#[wasm_bindgen]
pub enum SurfaceMode {
    Finite,
    Tore
}

#[wasm_bindgen]
pub struct World {
    width: i32,
    height: i32,
    cells: Vec<Cell>,
    cache: Vec<Cell>,
    mode: SurfaceMode,
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

    pub fn load_plaintext(&mut self, row: i32, col: i32, s: String) {
        let pattern = parse_plaintext(&s);
        for i in 0..pattern.height {
            for j in 0..pattern.width {
                self.set_cell(row + i, col + j, pattern.cells[(i * pattern.width + j) as usize]);
            }
        }
    }

    pub fn get_index(&self, mut row: i32, mut col: i32) -> i32 {
        if row < 0 { row = self.height + row };
        if col < 0 { col = self.width + col };
        let col = col % self.width;
        let row = row % self.height;
        (row * self.width + col)
    }

    pub fn get(&self, row: i32, col: i32) -> Cell {
        self.cells[self.get_index(row, col) as usize]
    }

    pub fn set_cell(&mut self, row: i32, col: i32, t: Cell) {
        let idx = self.get_index(row, col) as usize;
        self.cells[idx] = t;
    }

    pub fn set(&mut self, row: i32, col: i32, t: Cell) {
        let idx = self.get_index(row, col) as usize;
        self.cache[idx] = t;
    }

    pub fn clear(&mut self) {
        self.cells.iter_mut().for_each(|cell| *cell = Cell::Dead);
    }

    pub fn toggle(&mut self, row: i32, col: i32) {
        let idx = self.get_index(row, col) as usize;
        self.cells[idx] = match self.cells[idx] {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead
        }
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    pub fn alive_neighbors(&self, row: i32, col: i32) -> u8 {
        let check_out_of_bounds = |r, c| {
            match self.mode {
                SurfaceMode::Tore => {
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
                self.set(row, col, next_cell);
            }
        }

        ::std::mem::swap(&mut self.cells, &mut self.cache);
    }

    pub fn new(width: i32, height: i32) -> World {
        console_error_panic_hook::set_once();

        let data= vec![Cell::Dead; (width * height) as usize];

        World {
            width,
            height,
            cells: data.clone(),
            cache: data,
            mode: SurfaceMode::Finite,
        }
    }

    pub fn render(&self) -> String {
        self.to_string()
    }
}

use std::fmt;

impl fmt::Display for World {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells.chunks(self.width as usize) {
            for &cell in line {
                let symbol = if cell == Cell::Dead { ' ' } else { '#' };
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }

        Ok(())
    }
}
