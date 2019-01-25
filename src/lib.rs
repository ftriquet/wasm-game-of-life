#![feature(custom_attribute)]
#![allow(dead_code)]
#![allow(unused_attributes)]

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use console_error_panic_hook;

use wasm_bindgen::prelude::*;

use regex;
use regex::Regex;

pub fn parse_ints(x: &str, y: &str) -> Result<(i32, i32), String> {
    x.parse().and_then(|xi| y.parse::<i32>().map(|yi| (xi, yi))).map_err(|e| e.to_string())
}

pub fn parse_first_line(input: &str) -> Result<(i32, i32), String> {
    let r = Regex::new(r"x = (\d+), y = (\d+).*").unwrap();
    if let Some(captures) = r.captures_iter(input).next() {
        captures.get(1)
            .and_then(|x| captures.get(2).map(|y| (x, y)))
            .ok_or_else(|| "Invalid input".to_string())
            .and_then(|(x, y)| parse_ints(x.as_str(), y.as_str()))
    } else {
        Err("Invalid input".to_string())
    }
}

pub fn rle_parse(s: String) -> Result<Pattern, String> {
    let mut lines = s.lines();
    let header = lines.next().ok_or_else(|| "Empty pattern".to_string())?;
    parse_first_line(header).map(|(w, h)| {
        Pattern {
            width: w,
            height: h,
            cells: vec![Cell::Dead; (w * h) as usize]
        }
    })
}

pub struct Pattern {
    width: i32,
    height: i32,
    cells: Vec<Cell>,
}

#[wasm_bindgen]
pub struct World {
    width: i32,
    height: i32,
    cells: Vec<Cell>,
    cache: Vec<Cell>,
}


#[repr(C)]
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

#[wasm_bindgen]
impl World {
    pub fn load_rle_at(&mut self, row: i32, col: i32, pattern: String) {

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
            if row + r > 0 && row + r < self.height &&
                col + c > 0 && col + c < self.width {
                self.get(row + r, col + c) as u8
            } else {
                0
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

        // let data= vec![Cell::Dead; width * height];
        let data: Vec<Cell> = (0..width * height)
            .map(|i| {
                if i % 2 == 0 || i % 7 == 0 {
                    Cell::Alive
                } else {
                    Cell::Dead
                }
            })
            .collect();

        World {
            width,
            height,
            cells: data.clone(),
            cache: data,
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
