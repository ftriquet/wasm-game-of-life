// #![feature(custom_attribute)]

use console_error_panic_hook;

use wasm_bindgen::prelude::*;

use std::collections::HashSet;
use std::fmt::Write;

// {{{ parsing
mod parsing {
    use nom::{
        line_ending, take_until_and_consume,
        alt, do_parse, many0, many1, map, named, one_of, opt, space, tag,
        terminated, types::CompleteStr,
    };

    // {{{ types
    #[derive(Debug, PartialEq)]
    pub enum RleTag {
        NextLine,
        Dead,
        Alive
    }

    #[derive(Debug, PartialEq)]
    pub struct RleFirstLine(pub usize, pub usize);

    #[derive(Debug, PartialEq)]
    pub struct RleTagSequence(pub usize, pub RleTag);

    #[derive(Debug, PartialEq)]
    pub struct Rle {
        pub comments: Vec<RleComment>,
        pub size: RleFirstLine,
        pub content: Vec<RleTagSequence>,
    }

    #[derive(Debug, PartialEq)]
    pub enum RleComment {
        Comment(String),
        Name(String),
        Author(String),
        Coordinates(i32, i32),
        Other(String),
    }
    // }}}

    named!(
        rle_comment<CompleteStr, RleComment>,
        alt!(
            rle_comment_coordinates |
            rle_comment_author |
            rle_comment_name |
            rle_comment_comment |
            rle_comment_other
        )
    );

    named!(
        rle_comment_other<CompleteStr, RleComment>,
        do_parse!(
            opt!(space) >>
            tag!("#") >>
            x: take_until_and_consume!("\n") >>
            (RleComment::Other(x.to_string()))
        )
    );

    named!(
        rle_comment_coordinates<CompleteStr, RleComment>,
        do_parse!(
            opt!(space) >>
            alt!(tag!("#P ") | tag!("#R ")) >>
            x: signed_num >>
            space >>
            y: signed_num >>
            line_ending >>
            (RleComment::Coordinates(x, y))
        )
    );

    named!(
        rle_comment_author<CompleteStr, RleComment>,
        do_parse!(
            opt!(space) >>
            tag!("#O ") >>
            x: take_until_and_consume!("\n") >>
            (RleComment::Author(x.to_string()))
        )
    );

    named!(
        rle_comment_comment<CompleteStr, RleComment>,
        do_parse!(
            opt!(space) >>
            alt!(tag!("#C ") | tag!("#c ")) >>
            x: take_until_and_consume!("\n") >>
            (RleComment::Comment(x.to_string()))
        )
    );

    named!(
        rle_comment_name<CompleteStr, RleComment>,
        do_parse!(
            opt!(space) >>
            tag!("#N ") >>
            x: take_until_and_consume!("\n") >>
            (RleComment::Name(x.to_string()))
        )
    );

    use std::fmt::Debug;
    use std::str::FromStr;
    fn buf_to_int<T>(s: &[char]) -> T
    where
        T: FromStr,
        <T as FromStr>::Err: Debug,
    {
        s.iter()
            .collect::<String>()
            .parse()
            .expect("Trying to parse misformatted number")
    }

    named!(digit<CompleteStr, char>, one_of!("0123456789"));

    named!(
        signed_num<CompleteStr, i32>,
        do_parse!(
            sign: alt!(map!(tag!("-"), Some) | opt!(tag!("+"))) >>
            n: num >>
            (match sign {
                Some(CompleteStr("-")) => -(n as i32),
                _ => n as i32
            })
        )
    );

    named!(
        num<CompleteStr, usize>,
        do_parse!(
            digits: many1!(digit) >>
            (buf_to_int(&digits))
        )
    );

    named!(
        rle_first_line<CompleteStr, RleFirstLine>,
        do_parse!(
            opt!(space) >>
            tag!("x") >> opt!(space) >> tag!("=") >> opt!(space) >>
            x: num >>
            opt!(space) >> tag!(",") >> opt!(space) >>
            tag!("y") >> opt!(space) >> tag!("=") >> opt!(space) >>
            y: num >>
            take_until_and_consume!("\n") >>
            (RleFirstLine(x, y))
        )
    );

    #[cfg(test)]
    // {{{ first_line_tests
    mod firt_line_tests {
        use super::*;

        #[test]
        fn valid_first_line_test() {
            let expectations = vec![
                ("x = 3, y = 2\n", RleFirstLine(3, 2)),
                ("x = 100, y = 34, rules = adknajkdn ansdnaslkdn ksnd\n", RleFirstLine(100, 34)),
                ("x =     100,        y    = 34, rules = adknajkdn ansdnaslkdn ksnd\n", RleFirstLine(100, 34)),
                ("x=100,y=34,rules=adknajkdnansdnaslkdnksnd\n", RleFirstLine(100, 34)),
            ];

            expectations.into_iter().for_each(|(input, output)| {
                assert_eq!(rle_first_line(input.into()), Ok(("".into(), output)));
            });
        }

        #[test]
        fn invalid_first_line_test() {
            let expectations = vec![
                ("x = _3, y = 2\n", "_3,"),
                ("= 100, y = 34, rules = adknajkdn ansdnaslkdn ksnd\n", "="),
                ("x=100,y=34", ""),
                ("abcdef", "abcdef"),
            ];

            use nom::Err as NomErr;
            use nom::simple_errors::Context;

            expectations.into_iter().for_each(|(input, output)| {
                if let Err(NomErr::Error(Context::Code(CompleteStr(o), _))) = rle_first_line(input.into()) {
                    assert!(o.starts_with(output));
                } else {
                    panic!("{} should not be a valid input", input);
                }
            });
        }
    }
    // }}}

    named!(rle_tag_next_line<CompleteStr, RleTag>, do_parse!(tag!("$") >> (RleTag::NextLine)));
    named!(rle_tag_dead<CompleteStr, RleTag>, do_parse!(tag!("b") >> (RleTag::Dead)));
    named!(rle_tag_alive<CompleteStr, RleTag>, do_parse!(tag!("o") >> (RleTag::Alive)));
    named!(
        rle_tag<CompleteStr, RleTag>,
        alt!(
            rle_tag_next_line |
            rle_tag_dead |
            rle_tag_alive
        )
    );

    #[cfg(test)]
    // {{{ tag_tests
    mod tests_tag {
        use super::*;

        #[test]
        fn valid_tag_test() {
            let s = "b";
            assert_eq!(rle_tag(s.into()), Ok(("".into(), RleTag::Dead)));

            let s = "o";
            assert_eq!(rle_tag(s.into()), Ok(("".into(), RleTag::Alive)));
        }

        #[test]
        fn invalid_tag() {
            (0..127u8).into_iter().for_each(|c| {
                if c as char == 'b' || c as char == 'o' || c as char == '$' {
                    return;
                }
                let s = Some(c as char).iter().collect::<String>();
                assert!(rle_tag(s.as_str().into()).is_err());
            })
        }
    }
    // }}}

    named!(
        rle_tag_sequence<CompleteStr, RleTagSequence>,
        do_parse!(
            many0!(alt!(space | line_ending)) >>
            n: opt!(num) >>
            c: rle_tag >>
            (RleTagSequence(n.unwrap_or(1), c))
        )
    );

    #[cfg(test)]
    // {{{ tag_sequence_tests
    mod tests_rle_tag_sequence {
        use super::*;

        #[test]
        fn one_cell_no_number_sequence_test() {
            let s = "b$";
            assert_eq!(
                rle_tag_sequence(s.into()),
                Ok(("$".into(), RleTagSequence(1, RleTag::Dead)))
            );

            let s = "b\n";
            assert_eq!(
                rle_tag_sequence(s.into()),
                Ok(("\n".into(), RleTagSequence(1, RleTag::Dead)))
            );

            let s = "b";
            assert_eq!(
                rle_tag_sequence(s.into()),
                Ok(("".into(), RleTagSequence(1, RleTag::Dead)))
            );

            let s = "   babc";
            assert_eq!(
                rle_tag_sequence(s.into()),
                Ok(("abc".into(), RleTagSequence(1, RleTag::Dead)))
            );

            let s = "   o$";
            assert_eq!(
                rle_tag_sequence(s.into()),
                Ok(("$".into(), RleTagSequence(1, RleTag::Alive)))
            );

            let s = "o\n";
            assert_eq!(
                rle_tag_sequence(s.into()),
                Ok(("\n".into(), RleTagSequence(1, RleTag::Alive)))
            );

            let s = "o";
            assert_eq!(
                rle_tag_sequence(s.into()),
                Ok(("".into(), RleTagSequence(1, RleTag::Alive)))
            );

            let s = "oabc";
            assert_eq!(
                rle_tag_sequence(s.into()),
                Ok(("abc".into(), RleTagSequence(1, RleTag::Alive)))
            );
        }

        #[test]
        fn invalid_cells_sequence_test() {
            let s = "abc";
            let x = rle_tag_sequence(s.into());
            assert!(x.is_err());

            let s = "23";
            let x = rle_tag_sequence(s.into());
            assert!(x.is_err());

            let s = "   ";
            let x = rle_tag_sequence(s.into());
            assert!(x.is_err());

            let s = "\t";
            let x = rle_tag_sequence(s.into());
            assert!(x.is_err());

            let s = "\n";
            let x = rle_tag_sequence(s.into());
            assert!(x.is_err());

            let s = "-3b";
            let x = rle_tag_sequence(s.into());
            assert!(x.is_err());
        }

        #[test]
        fn valid_several_cells_rle_tag_sequence_test() {
            let s = "36b";
            let x = rle_tag_sequence(s.into());
            assert_eq!(x, Ok(("".into(), RleTagSequence(36, RleTag::Dead))));

            let s = "      1b";
            let x = rle_tag_sequence(s.into());
            assert_eq!(x, Ok(("".into(), RleTagSequence(1, RleTag::Dead))));

            let s = "100000000b";
            let x = rle_tag_sequence(s.into());
            assert_eq!(x, Ok(("".into(), RleTagSequence(100000000, RleTag::Dead))));

            let s = "36o";
            let x = rle_tag_sequence(s.into());
            assert_eq!(x, Ok(("".into(), RleTagSequence(36, RleTag::Alive))));

            let s = "1o";
            let x = rle_tag_sequence(s.into());
            assert_eq!(x, Ok(("".into(), RleTagSequence(1, RleTag::Alive))));

            let s = "    100000000o";
            let x = rle_tag_sequence(s.into());
            assert_eq!(x, Ok(("".into(), RleTagSequence(100000000, RleTag::Alive))));
        }
    }
    // }}}

    named!(
        pub parse_rle<CompleteStr, Rle>,
        terminated!(
            do_parse!(
                comments: many0!(rle_comment) >>
                l: rle_first_line >>
                ct: many1!(rle_tag_sequence) >>
                (Rle {
                    comments: comments,
                    size: l,
                    content: ct
                })
            ),
            tag!("!")
        )
    );

    #[cfg(test)]
    // {{{ rle_parse_tests
    mod tests {
        use super::*;

        #[test]
        fn all_patterns_test() {
            use std::io::{self, Read};
            use std::fs::{self};
            use std::path::Path;

            fn visit_dirs<F: Fn(&Path)>(dir: &Path, cb: F) -> io::Result<()> {
                if dir.is_dir() {
                    for entry in fs::read_dir(dir)? {
                        let entry = entry?;
                        let path = entry.path();
                        if path.is_file() {
                            cb(&path);
                        }
                    }
                }
                Ok(())
            }

            visit_dirs(Path::new("patterns"), |path| {
                let mut f = fs::File::open(path).unwrap();
                let mut s = String::new();
                f.read_to_string(&mut s).expect(&format!("Unable to read file {:?}", path));
                if let Err(e) = parse_rle(s.as_str().into()) {
                    panic!("Failed to parse {:?}: {:?}", path, e);
                }
            }).unwrap();
        }

        #[test]
        fn rle_parsing_test() {
            let complete = r"#N Smiley
        #O Achim Flammenkamp
        #C A period 8 oscillator found in July 1994.
        #C www.conwaylife.com/wiki/index.php?title=Smiley
        #R -12 30
        x = 7, y = 7, rule = 23/3
        3ob3o$bobobob2$!
        ";
            let x = parse_rle(complete.into());
            let rle = Rle{
                comments: vec![
                    RleComment::Name("Smiley".to_string()),
                    RleComment::Author("Achim Flammenkamp".to_string()),
                    RleComment::Comment("A period 8 oscillator found in July 1994.".to_string()),
                    RleComment::Comment("www.conwaylife.com/wiki/index.php?title=Smiley".to_string()),
                    RleComment::Coordinates(-12, 30)
                ],
                size: RleFirstLine(7, 7),
                content: vec![
                    RleTagSequence(3, RleTag::Alive),
                    RleTagSequence(1, RleTag::Dead),
                    RleTagSequence(3, RleTag::Alive),
                    RleTagSequence(1, RleTag::NextLine),
                    RleTagSequence(1, RleTag::Dead),
                    RleTagSequence(1, RleTag::Alive),
                    RleTagSequence(1, RleTag::Dead),
                    RleTagSequence(1, RleTag::Alive),
                    RleTagSequence(1, RleTag::Dead),
                    RleTagSequence(1, RleTag::Alive),
                    RleTagSequence(1, RleTag::Dead),
                    RleTagSequence(2, RleTag::NextLine),
                ]
            };
            assert_eq!(x.map(|r| r.1), Ok(rle));
        }
    }
    // }}}
}
//  }}}

use std::hash::{Hasher, BuildHasher};

pub struct CustomHasher(u64);
impl Hasher for CustomHasher {
    fn write(&mut self, bytes: &[u8]) {
        self.0 = unsafe { *(bytes.as_ptr() as *const u64) }
    }

    fn finish(&self) -> u64 {
        self.0
    }
}

pub struct CustomHasherBuilder;

impl BuildHasher for CustomHasherBuilder {
    type Hasher = CustomHasher;
    fn build_hasher(&self) -> Self::Hasher {
        CustomHasher(0)
    }
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);
    #[wasm_bindgen(js_namespace=Math)]
    fn random() -> f64;
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


fn flatten<T>(o: Option<Option<T>>) -> Option<T> {
    match o {
        Some(Some(t)) => Some(t),
        _ => None
    }
}

pub struct FirstN<'a, I> {
    inner: &'a mut I,
    n: usize,
    count: usize
}

impl<'a, I: 'a + Iterator> Iterator for FirstN<'a, I> {
    type Item = <I as Iterator>::Item;

    fn next(&mut self) -> Option<Self::Item> {
        if self.count >= self.n { return None; }
        self.count += 1;
        self.inner.next()
    }
}

fn first_n<I>(i: &mut I, n: usize) -> FirstN<I> {
    FirstN {
        inner: i,
        n,
        count: 0
    }
}

#[wasm_bindgen]
impl World {
    pub fn load_string(&mut self, pattern: String) {
        let res = parsing::parse_rle(pattern.as_str().into());
        match res {
            Ok((_, pat)) => {
                self.load_rle(pat);
            }
            Err(_) => {
                log("Failed to parse rle string");
            }
        }
    }

    pub fn export_rle(&self) -> String {
        let first_line_idx = self.cells.iter().position(|c| *c == Cell::Alive);
        if let None = first_line_idx {
            return "".to_string();
        }
        let (first_line, _) = self.from_index(first_line_idx.unwrap() as i32);

        let last_line_idx = self.cells.iter().rposition(|c| *c == Cell::Alive);
        if let None = last_line_idx {
            return "".to_string();
        }
        let (last_line, _) = self.from_index(last_line_idx.unwrap() as i32);

        let mut first_column = self.width;
        let mut last_column = 0;

        let mut cells = self.cells.iter();
        for _ in 0..self.height  {
            let mut row = first_n(&mut cells, self.width as usize).enumerate();
            let first_col_alive = row.find(|(_, c)| **c == Cell::Alive);
            let last_col_alive = row.filter(|(_, c)| **c == Cell::Alive).last().or(first_col_alive);
            if let Some((pos, _)) = first_col_alive {
                first_column = ::std::cmp::min(first_column, pos as i32);
            }
            if let Some((pos, _)) = last_col_alive {
                last_column = ::std::cmp::max(last_column, pos as i32);
            }
        }

        let mut buff = String::new();

        write!(&mut buff, "x = {}, y = {}\n", last_column - first_column + 1, last_line - first_line + 1);

        let mut cells = self.cells.iter().skip((first_line * self.width) as usize);
        for _ in first_line..=last_line {
            let mut row = first_n(&mut cells, self.width as usize).skip(first_column as usize).peekable();
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
                    write!(&mut buff, "{}{}", n, c);
                }
            }
            write!(&mut buff, "{}", '$');
        }
        write!(&mut buff, "{}", '!');

        buff
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

    fn load_rle(&mut self, rle: parsing::Rle) {
        let coords = rle.comments.iter().map(|c| {
            match c {
                parsing::RleComment::Coordinates(x, y) => Some((*x, *y)),
                _ => None
            }
        }).find(Option::is_some);
        let (x, y) = flatten(coords).unwrap_or((0, 0));

        let origin_x = self.width / 2;
        let origin_y = self.height / 2;

        let top_left_x = origin_x + x;
        let top_left_y = origin_y + y;

        let mut i = top_left_x;
        let mut j = top_left_y;
        rle.content.iter().for_each(|seq| {
            match seq {
                parsing::RleTagSequence(count, parsing::RleTag::NextLine) => {
                    (0..*count).for_each(|_| {
                        j += 1;
                    });
                    i = top_left_x;
                },
                parsing::RleTagSequence(count, state) => {
                    (0..*count).for_each(|_| {
                        let cell = match state {
                            parsing::RleTag::Dead => Cell::Dead,
                            parsing::RleTag::Alive => Cell::Alive,
                            _ => unreachable!()
                        };
                        self.set_cell(j, i, cell);
                        i += 1;
                    })
                }
            }
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

    pub fn next_tick(&mut self) {
        let mut cells_to_check = HashSet::with_capacity_and_hasher((self.width * self.height) as usize, CustomHasherBuilder);
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
            (0..(self.width*self.height)).for_each(|i| {
                cells_to_check.insert(i);
            });
        }

        let mut new_changed_cells = Vec::new();
        cells_to_check.iter().for_each(|idx| {
            let (row, col) = self.from_index(*idx);
            let cell = self.get(row, col);
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
            generations: 0,
            changed_cells: Vec::new(),
        }
    }
}
