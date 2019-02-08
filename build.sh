cargo +nightly build --release --target wasm32-unknown-unknown
wasm-bindgen \
  target/wasm32-unknown-unknown/release/game_of_life.wasm \
  --out-dir build \
  --no-modules \
  --no-modules-global gameOfLife
