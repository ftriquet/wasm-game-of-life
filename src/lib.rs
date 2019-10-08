use console_error_panic_hook;

use image;
use image::GenericImageView;
use wasm_bindgen::prelude::*;

use std::fmt::Write;

mod number_hashset;
mod parser;

struct Rect<N> {
    x: N,
    y: N,
    width: N,
    height: N,
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub struct World {
    width: i32,
    height: i32,
    cells: Vec<Cell>,
    cache: Vec<Cell>,
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

use image::Pixel;
impl std::convert::From<image::Rgba<u8>> for Cell {
    fn from(a: image::Rgba<u8>) -> Self {
        let l = a.to_luma();
        if l.data[0] < 255 / 2 {
            Cell::Alive
        } else {
            Cell::Dead
        }
    }
}

fn flatten<T>(o: Option<Option<T>>) -> Option<T> {
    match o {
        Some(Some(t)) => Some(t),
        _ => None,
    }
}

pub struct FirstN<'a, I> {
    inner: &'a mut I,
    n: usize,
    count: usize,
}

impl<'a, I: 'a + Iterator> Iterator for FirstN<'a, I> {
    type Item = <I as Iterator>::Item;

    fn next(&mut self) -> Option<Self::Item> {
        if self.count >= self.n {
            return None;
        }
        self.count += 1;
        self.inner.next()
    }
}

fn first_n<I>(i: &mut I, n: usize) -> FirstN<I> {
    FirstN {
        inner: i,
        n,
        count: 0,
    }
}

#[wasm_bindgen]
impl World {
    pub fn load_string(&mut self, pattern: String) {
        let res = parser::parse_rle(pattern.as_str().into());
        match res {
            Ok((_, pat)) => {
                self.load_rle(pat);
            }
            Err(_) => {
                log("Failed to parse rle string");
            }
        }
    }

    pub fn width(&self) -> i32 {
        self.width
    }

    pub fn height(&self) -> i32 {
        self.height
    }

    fn pattern_boundaries(&self) -> Option<Rect<usize>> {
        let first_line_idx = self.cells.iter().position(|c| *c == Cell::Alive);
        if let None = first_line_idx {
            return None;
        }
        let (first_line, _) = self.from_index(first_line_idx.unwrap() as i32);
        let first_line = first_line as usize;

        let last_line_idx = self.cells.iter().rposition(|c| *c == Cell::Alive);
        if let None = last_line_idx {
            return None;
        }
        let (last_line, _) = self.from_index(last_line_idx.unwrap() as i32);
        let last_line = last_line as usize;

        let mut first_column = self.width as usize;
        let mut last_column = 0;

        let mut cells = self.cells.iter();
        for _ in 0..self.height {
            let mut row = first_n(&mut cells, self.width as usize).enumerate();
            let first_col_alive = row.find(|(_, c)| **c == Cell::Alive);
            let last_col_alive = row
                .filter(|(_, c)| **c == Cell::Alive)
                .last()
                .or(first_col_alive);
            if let Some((pos, _)) = first_col_alive {
                first_column = ::std::cmp::min(first_column, pos);
            }
            if let Some((pos, _)) = last_col_alive {
                last_column = ::std::cmp::max(last_column, pos);
            }
        }
        Some(Rect {
            x: first_column,
            y: first_line,
            width: last_column - first_column + 1,
            height: last_line - first_line + 1,
        })
    }

    pub fn export_rle(&self) -> String {
        let pattern_boundaries = self.pattern_boundaries();

        if pattern_boundaries.is_none() {
            return "".to_string();
        }
        let bounds = pattern_boundaries.unwrap();

        let mut buff = String::new();

        let center_col = self.width / 2;
        let center_row = self.height / 2;
        write!(
            &mut buff,
            "#R {} {}\nx = {}, y = {}\n",
            bounds.x as i32 - center_col,
            bounds.y as i32 - center_row,
            bounds.width,
            bounds.height
        )
        .ok();

        self.write_pattern(bounds, &mut buff);

        buff
    }

    fn write_pattern<W: std::fmt::Write>(&self, bounds: Rect<usize>, mut w: W) -> () {
        let mut cells = self.cells.iter().skip(bounds.y * self.width as usize);
        for _ in bounds.y..=(bounds.y + bounds.height) {
            let mut row = first_n(&mut cells, self.width as usize)
                .skip(bounds.x)
                .peekable();
            while let Some(cell) = row.next() {
                let mut n = 1;
                while let Some(&c) = row.peek() {
                    if c == cell {
                        n += 1;
                        row.next();
                    } else {
                        break;
                    }
                }
                let c = match cell {
                    Cell::Alive => 'o',
                    Cell::Dead => 'b',
                };
                if *cell == Cell::Alive || row.peek().is_some() {
                    write!(w, "{}{}", n, c).ok();
                }
            }
            write!(w, "{}", '$').ok();
        }
        write!(w, "{}", '!').ok();
    }

    pub fn resize(&mut self, width: i32, height: i32) {
        let mut new_world = World::new(width, height);
        let copy_end_width = ::std::cmp::min(width, self.width);
        let copy_end_height = ::std::cmp::min(height, self.height);
        for row in 0..copy_end_height {
            for col in 0..copy_end_width {
                new_world.set_cell(row, col, self.get(row, col));
            }
        }

        ::std::mem::swap(self, &mut new_world);
    }

    fn load_rle(&mut self, rle: parser::Rle) {
        let coords = rle
            .comments
            .iter()
            .map(|c| match c {
                parser::RleComment::Coordinates(x, y) => Some((*x, *y)),
                _ => None,
            })
            .find(Option::is_some);
        let (x, y) = flatten(coords).unwrap_or((0, 0));

        let origin_x = self.width / 2;
        let origin_y = self.height / 2;

        let top_left_x = origin_x + x - (rle.size.0 / 2) as i32;
        let top_left_y = origin_y + y - (rle.size.1 / 2) as i32;

        let mut i = top_left_x;
        let mut j = top_left_y;
        rle.content.iter().for_each(|seq| match seq {
            parser::RleTagSequence(count, parser::RleTag::NextLine) => {
                (0..*count).for_each(|_| {
                    j += 1;
                });
                i = top_left_x;
            }
            parser::RleTagSequence(count, state) => (0..*count).for_each(|_| {
                let cell = match state {
                    parser::RleTag::Dead => Cell::Dead,
                    parser::RleTag::Alive => Cell::Alive,
                    _ => unreachable!(),
                };
                self.set_cell(j, i, cell);
                i += 1;
            }),
        })
    }

    #[inline(always)]
    fn get_index(&self, mut row: i32, mut col: i32) -> i32 {
        if row < 0 {
            row += self.height;
        };
        if col < 0 {
            col += self.width;
        };
        let col = col % self.width;
        let row = row % self.height;
        (row * self.width + col)
    }

    #[inline(always)]
    fn get(&self, row: i32, col: i32) -> Cell {
        self.cells[self.get_index(row, col) as usize]
    }

    pub fn set_cell(&mut self, row: i32, col: i32, t: Cell) {
        let idx = self.get_index(row, col);
        self.changed_cells.push(idx);
        let idx = idx as usize;
        self.cells[idx] = t;
    }

    fn set(&mut self, row: i32, col: i32, t: Cell) {
        let idx = self.get_index(row, col) as usize;
        self.cache[idx] = t;
    }

    pub fn clear(&mut self) {
        self.cells.iter_mut().for_each(|cell| *cell = Cell::Dead);
        self.reset_changed_cells();
        self.changed_cells = (0..self.cells.len() as i32).collect();
    }

    pub fn toggle(&mut self, row: i32, col: i32) {
        let idx = self.get_index(row, col);
        self.changed_cells.push(idx);
        let idx = idx as usize;
        self.cells[idx] = match self.cells[idx] {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead,
        }
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    fn alive_neighbors(&self, row: i32, col: i32) -> u8 {
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
            .iter()
            .map(|(r, c)| self.get(row + r, col + c) as u8)
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

    fn get_idx(&self, idx: usize) -> Cell {
        self.cells[idx]
    }

    pub fn next_tick(&mut self) {
        let mut cells_to_check = number_hashset::hashset((self.width * self.height) as usize);
        self.changed_cells.iter().for_each(|idx| {
            cells_to_check.insert(*idx);
            cells_to_check.insert(*idx - 1);
            cells_to_check.insert(*idx + 1);

            cells_to_check.insert(*idx - self.width - 1);
            cells_to_check.insert(*idx - self.width);
            cells_to_check.insert(*idx - self.width + 1);

            cells_to_check.insert(*idx + self.width - 1);
            cells_to_check.insert(*idx + self.width);
            cells_to_check.insert(*idx + self.width + 1);
        });

        if cells_to_check.is_empty() {
            cells_to_check.extend(0..(self.width * self.height));
        }

        let mut new_changed_cells = Vec::new();
        cells_to_check.iter().for_each(|idx| {
            let (row, col) = self.from_index(*idx);
            let cell = self.get_idx(*idx as usize);
            let neighbors = self.alive_neighbors(row, col);
            let next_cell = match (cell, neighbors) {
                (Cell::Alive, 2) | (_, 3) => Cell::Alive,
                _ => Cell::Dead,
            };
            if cell != next_cell {
                new_changed_cells.push(*idx);
            }
            self.set(row, col, next_cell);
        });

        self.generations += 1;

        ::std::mem::swap(&mut self.cells, &mut self.cache);
        ::std::mem::swap(&mut self.changed_cells, &mut new_changed_cells);
    }

    fn from_index(&self, mut idx: i32) -> (i32, i32) {
        if idx < 0 {
            idx += self.width * self.height;
        }
        let row = idx / self.width;
        let col = idx % self.width;
        (row, col)
    }

    pub fn new(width: i32, height: i32) -> World {
        console_error_panic_hook::set_once();

        let data = vec![Cell::Dead; (width * height) as usize];

        World {
            width,
            height,
            cells: data.clone(),
            cache: data,
            generations: 0,
            changed_cells: Vec::new(),
        }
    }

    pub fn from_image(data: Vec<u8>) -> World {
        let im = image::load_from_memory(&data)
            .expect("Invalid image data")
            .grayscale();
        let mut world = World::new(im.width() as i32, im.height() as i32);
        for pixel in im.pixels() {
            let (x, y, pix) = pixel;
            world.set_cell(y as i32, x as i32, Cell::from(pix));
        }
        world
    }
}
