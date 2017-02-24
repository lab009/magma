import HappyPack from 'happypack'

// Generates a HappyPack plugin.
// @see https://github.com/amireh/happypack/
export default function happyPackPlugin({ name, loaders }) {
  return new HappyPack({
    id: name,
    verbose: false,
    threads: 4,
    loaders,
  })
}
