import HappyPack from 'happypack'

// Shared thread pools
const happyThreadPool = HappyPack.ThreadPool({ size: 4 })

// Generates a HappyPack plugin.
// @see https://github.com/amireh/happypack/
export default function happyPackPlugin({ name, loaders }) {
  return new HappyPack({
    id: name,
    verbose: false,
    threadPool: happyThreadPool,
    loaders,
  })
}
