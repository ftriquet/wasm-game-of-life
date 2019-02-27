use std::collections::HashSet;

use std::hash::{BuildHasher, Hasher};

// This hasher will only be used to hash i32
pub struct NumberHasher(i32);
impl Hasher for NumberHasher {
    fn write(&mut self, bytes: &[u8]) {
        self.0 = unsafe { *(bytes.as_ptr() as *const i32) };
    }

    fn finish(&self) -> u64 {
        self.0 as u64
    }
}

pub struct NumberHasherBuilder;

impl BuildHasher for NumberHasherBuilder {
    type Hasher = NumberHasher;
    fn build_hasher(&self) -> Self::Hasher {
        NumberHasher(0)
    }
}

pub fn hashset(cap: usize) -> HashSet<i32, NumberHasherBuilder> {
    HashSet::with_capacity_and_hasher(cap, NumberHasherBuilder)
}
