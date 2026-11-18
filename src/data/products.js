export const products = [
  { id: "p1", name: "Everyday Tote", category: "Accessories", price: 68, oldPrice: 84, color: "Natural / 2 colors", tag: "BESTSELLER", image: "photo-1590874103328-eac38a683ce7", rating: 4.9 },
  { id: "p2", name: "Studio Ceramic Set", category: "Home", price: 54, oldPrice: null, color: "Chalk / Set of 2", tag: "NEW", image: "photo-1493106641515-6b5631de4bb9", rating: 4.8 },
  { id: "p3", name: "Cloud Knit Sweater", category: "Apparel", price: 128, oldPrice: null, color: "Oat / 4 colors", tag: null, image: "photo-1576566588028-4147f3842f27", rating: 4.9 },
  { id: "p4", name: "Sculptural Table Lamp", category: "Home", price: 146, oldPrice: 180, color: "Warm white", tag: "−19%", image: "photo-1507473885765-e6ed057f782c", rating: 4.7 },
  { id: "p5", name: "Weekend Leather Bag", category: "Accessories", price: 189, oldPrice: null, color: "Espresso / 2 colors", tag: null, image: "photo-1553062407-98eeb64c6a62", rating: 4.8 },
  { id: "p6", name: "Linen Lounge Set", category: "Apparel", price: 112, oldPrice: 140, color: "Sage / 3 colors", tag: "−20%", image: "photo-1598033129183-c4f50c736f10", rating: 4.6 },
  { id: "p7", name: "Ribbed Glass Tumblers", category: "Home", price: 38, oldPrice: null, color: "Clear / Set of 4", tag: "NEW", image: "photo-1514228742587-6b1558fcca3d", rating: 4.9 },
  { id: "p8", name: "Form Leather Slides", category: "Apparel", price: 92, oldPrice: null, color: "Stone / 5 sizes", tag: null, image: "photo-1543163521-1bf539c55dd2", rating: 4.7 }
].map((product) => ({
  ...product,
  imageUrl: `https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=900&q=85`
}));
