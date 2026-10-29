/* ==========================================================================
   Spool & Spark: store configuration and catalogue data.
   Edit this file to change business details or products. Prices are numbers
   (or null for "Price on request"). Never use strings, and never treat an
   unknown price as zero.
   ========================================================================== */

window.STORE_CONFIG = {
  brandName: "Spool & Spark",
  tagline: "Ideas into reality, layer by layer.",
  currency: "INR",
  locale: "en-IN",
  // Taken from the live reference site. VERIFY before launch.
  whatsappNumber: "919403248879",          // country code + number, no "+" or spaces
  contactEmail: "3dprinter680@gmail.com",  // VERIFY before launch
  instagramUrl: "https://www.instagram.com/spool_and.spark/?hl=en",
  location: "Made in India",
  showAnnouncement: true,
  announcement: "Custom 3D prints made in India. Share your idea on WhatsApp for a quotation."
};

window.CATEGORIES = [
  { slug: "personalized-gifts", name: "Personalized Gifts", description: "Name keychains, couple and best-friend gifts." },
  { slug: "toys-fidget",        name: "Toys & Fidget",      description: "Hands-on fidgets, playful puzzles, spinning shapes and colorful pretend-play sets." },
  { slug: "desk-accessories",   name: "Desk Accessories",   description: "Organizers and holders for a tidy desk." },
  { slug: "idols-home-decor",   name: "Idols & Home Decor", description: "Ganesh idols, figures and decorative pieces." },
  { slug: "diwali-collection",  name: "Diwali Collection",  description: "Festive diyas, lotus lights, tea light holders and lanterns." }
];

/* Product names and categories come from the live reference site.
   Descriptions are placeholders for layout testing. Replace them, and fill in
   material and dimensions, with verified product information. */
window.PRODUCTS = [
  {
    id: "p-custom-name-keychain", slug: "custom-name-keychain", name: "Custom Name Keychain",
    category: "personalized-gifts", featured: true, alt: "3D-printed custom name keychain",
    shortDescription: "A personalised name keychain, made to the name you send us.",
    description: "Send us the name and colour you would like and we will prepare your keychain. Details are confirmed with you before anything is printed.",
    image: "assets/images/keychain.jpeg", gallery: ["assets/images/keychain.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["keychain", "name", "gift", "personalised", "couple", "best friend"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-fluffy-tail-cat-toy", slug: "fluffy-tail-cat-toy", name: "Fluffy Tail Cat Toy",
    category: "personalized-gifts", featured: false, alt: "3D-printed fluffy tail cat toy",
    shortDescription: "A playful cat-inspired toy with a fluffy tail design.",
    description: "A charming cat toy with a distinctive fluffy-tail look. Ask us about available colors and options.",
    image: "assets/images/Fluffy tail cat toy.jpeg", gallery: ["assets/images/Fluffy tail cat toy.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["cat", "fluffy tail", "toy", "gift", "animal"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-locking-cash-gift-box", slug: "locking-cash-gift-box", name: "Locking Gift Box Puzzle for Cash",
    category: "personalized-gifts", featured: false, alt: "3D-printed locking gift box puzzle for cash",
    shortDescription: "A puzzle gift box that makes giving cash more playful.",
    description: "Make a cash gift more memorable with this locking puzzle box. Contact us to confirm available colors and options.",
    image: "assets/images/Locking gift box puzzle for cash.jpeg", gallery: ["assets/images/Locking gift box puzzle for cash.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["gift box", "puzzle", "cash gift", "locking", "personalized gift"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-bal-ganesh-idol", slug: "ganesh-idol", name: "Bal Ganesh Idol",
    category: "idols-home-decor", featured: true, alt: "3D-printed Bal Ganesh idol",
    shortDescription: "A 3D-printed Bal Ganesh idol for home decor.",
    description: "A decorative Bal Ganesh idol printed in our studio. Ask us about sizes and finishes before ordering.",
    image: "assets/images/ganesh.jpeg", gallery: ["assets/images/ganesh.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["ganesh", "idol", "decor", "devotional", "bal ganesh"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-hooded-shelf-figure", slug: "hooded-shelf-figure", name: "Hooded Shelf-Sitter Figure",
    category: "idols-home-decor", featured: true, alt: "3D-printed hooded shelf-sitter figure",
    shortDescription: "A decorative figure that sits neatly on a shelf.",
    description: "A printed figure designed to sit on a shelf or desk as a decorative piece.",
    image: "assets/images/hooded-figure.png", gallery: ["assets/images/hooded-figure.png"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["figure", "shelf", "decor", "collectible"],
    material: null, dimensions: null, customizationAvailable: false
  },
  {
    id: "p-articulated-flexi-gecko", slug: "flexi-gecko", name: "Articulated Flexi Gecko",
    category: "toys-fidget", featured: true, alt: "3D-printed articulated flexi gecko",
    shortDescription: "A bendable, articulated gecko toy.",
    description: "A flexible, articulated gecko that bends and poses easily. A playful desk companion.",
    image: "assets/images/fidget.jpg", gallery: ["assets/images/fidget.jpg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["flexi", "articulated", "toy", "fidget", "gecko"],
    material: null, dimensions: null, customizationAvailable: false
  },
  {
    id: "p-snap-brick", slug: "snap-brick", name: "Snap Brick Fidget",
    category: "toys-fidget", featured: false, alt: "Blue 3D-printed brick-shaped fidget with raised round studs",
    shortDescription: "A bold blue brick with tactile studs for hands-on fidgeting.",
    description: "This chunky brick-shaped fidget has a row of raised round studs and a satisfying, easy-to-hold shape. Ask us about available colors.",
    image: "assets/images/Snap brick.jpeg", gallery: ["assets/images/Snap brick.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["snap brick", "brick", "fidget", "sensory", "toy", "blue"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-spinning-shapes", slug: "spinning-shapes", name: "Spinning Shapes",
    category: "toys-fidget", featured: false, alt: "Colorful 3D-printed spinning shapes set with stacked twistable pieces and geometric blocks",
    shortDescription: "A colorful set of stackable shapes designed for twisting and spinning.",
    description: "This bright play set pairs geometric blocks with twistable, spinning shapes for open-ended hands-on play. Colors may vary; contact us to check current options.",
    image: "assets/images/Spinning shape.jpeg", gallery: ["assets/images/Spinning shape.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["spinning", "shapes", "twisty", "toy", "fidget", "colorful", "play"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-logical-sliding-puzzle", slug: "logical-sliding-puzzle", name: "Logical Sliding Puzzle",
    category: "toys-fidget", featured: false, alt: "3D-printed logical sliding puzzle",
    shortDescription: "A hands-on sliding puzzle for a little screen-free problem solving.",
    description: "Slide the pieces and work through this compact logic puzzle. Ask us about available colors and options.",
    image: "assets/images/Logical sliding puzzle.jpeg", gallery: ["assets/images/Logical sliding puzzle.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["logical puzzle", "sliding puzzle", "puzzle", "brain teaser", "toy"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-sprout-portion-play-set", slug: "sprout-portion-play-set", name: "Sprout Portion Play Set",
    category: "toys-fidget", featured: false, alt: "Colorful pretend-play portion set with a tray, small cups, bowls, bottles and a spoon",
    shortDescription: "A colorful pretend-play set with a tray and miniature serving pieces.",
    description: "A bright assortment of miniature cups, bowls, bottles and a spoon arranged on a tray for imaginative pretend play. Contact us to confirm the set contents and available colors.",
    image: "assets/images/Sprout portion play set.jpeg", gallery: ["assets/images/Sprout portion play set.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["sprout", "portion", "pretend play", "play set", "toy", "kids"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-frog-jump-launcher", slug: "frog-jump-launcher", name: "Frog Jump Launcher",
    category: "toys-fidget", featured: false, alt: "Bright yellow frog-shaped jump toys shown launching and ready to press",
    shortDescription: "A playful frog toy made for press-and-launch fun.",
    description: "Press the frog-shaped toy and watch it spring into a jump. A simple, playful design available in assorted colors; ask us about the current selection.",
    image: "assets/images/Frog jump.jpeg", gallery: ["assets/images/Frog jump.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["frog", "jump", "launcher", "toy", "press", "play"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-childrens-giraffe", slug: "childrens-giraffe", name: "Rolling Giraffe Toy",
    category: "toys-fidget", featured: false, alt: "Pink 3D-printed giraffe toy on two wooden-look wheels",
    shortDescription: "A sweet, rolling giraffe figure with two wheels.",
    description: "A friendly pink giraffe figure mounted on two wheels, ready to roll along during imaginative play. Ask us about available colors.",
    image: "assets/images/Children's Giraffe.jpeg", gallery: ["assets/images/Children's Giraffe.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["giraffe", "rolling", "wheels", "toy", "animal", "kids"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-carrot-pops-memory-game", slug: "carrot-pops-memory-game", name: "Carrot Pops Memory Game",
    category: "toys-fidget", featured: false, alt: "Round carrot-themed memory game board with colorful pop-up carrot pieces",
    shortDescription: "A cheerful carrot-themed matching game with pop-up pieces.",
    description: "A playful round board filled with little carrot pieces for a pick, remember and match game. Ask us about the set contents and available colors.",
    image: "assets/images/Carrot pops.jpeg", gallery: ["assets/images/Carrot pops.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["carrot", "memory game", "board game", "matching", "toy", "play"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-bao-bun-fidget", slug: "bao-bun-fidget", name: "Twisty Bao Bun Fidget",
    category: "toys-fidget", featured: false, alt: "Rainbow-gradient bao bun character fidget toy with large eyes and a rounded twistable shell",
    shortDescription: "A colorful bao bun character with a twistable, tactile shell.",
    description: "This cheerful bao bun character combines a playful face with a twistable shell for a satisfying hands-on fidget. Ask us about available colors.",
    image: "assets/images/Bao buns.jpeg", gallery: ["assets/images/Bao buns.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["bao bun", "twisty", "fidget", "sensory", "toy", "character"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-desk-organizer-pen-holder", slug: "desk-organizer", name: "Desk Organizer with Pen Holder",
    category: "desk-accessories", featured: true, alt: "3D-printed desk organizer with pen holder",
    shortDescription: "A desk organizer with room for pens and essentials.",
    description: "A tidy desk organizer with a dedicated pen holder. Ask about custom compartments.",
    image: "assets/images/desk.jpg", gallery: ["assets/images/desk.jpg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["desk", "organizer", "pen holder", "stationery"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-lattice-hero-figure", slug: "lattice-hero-figure", name: "Lattice Hero Figure",
    category: "idols-home-decor", featured: false, alt: "3D-printed lattice hero figure",
    shortDescription: "A lattice-patterned hero figure for display.",
    description: "A lattice-patterned figure for display on a shelf or desk.",
    image: "assets/images/batman.jpeg", gallery: ["assets/images/batman.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["figure", "lattice", "hero", "decor"],
    material: null, dimensions: null, customizationAvailable: false
  },
  {
    id: "p-diwali-flower-flame-tealight", slug: "diwali-flower-flame-tealight", name: "Diwali Flower Flame Tealight Set",
    category: "diwali-collection", featured: false, alt: "Colorful lotus-shaped tealight holders with flame-shaped centers, arranged in pink, green, blue and peach",
    shortDescription: "Colorful lotus-shaped holders with flame-inspired centers for a festive display.",
    description: "A set of flower-shaped festive holders in bright colors, each with a flame-shaped center. Ask us about available colors and set options.",
    image: "assets/images/Diwali Flower Flame Tealight.jpeg", gallery: ["assets/images/Diwali Flower Flame Tealight.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["diwali", "flower", "flame", "tealight", "lotus", "festive"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-diwali-diya", slug: "diwali-diya", name: "Diwali Diya Set",
    category: "diwali-collection", featured: false, alt: "Four red bowl-shaped Diwali diyas with bright yellow flame-shaped centers",
    shortDescription: "A bright red diya set with flame-shaped details for festive decor.",
    description: "A row of red bowl-shaped diyas with yellow flame-shaped centers, made for a cheerful Diwali display. Contact us to confirm available colors and set options.",
    image: "assets/images/Diwali diya.jpeg", gallery: ["assets/images/Diwali diya.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["diwali", "diya", "lamp", "festive", "decor"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-golden-flower-tealight-holder", slug: "golden-flower-tealight-holder", name: "Golden Flower Tealight Holder",
    category: "diwali-collection", featured: false, alt: "Golden lotus-shaped flower holder with a glowing light at its center",
    shortDescription: "A golden lotus-inspired holder that adds a warm accent to festive decor.",
    description: "Layered golden petals surround the center of this flower-shaped holder. A decorative accent for a festive table or shelf.",
    image: "assets/images/Golden flower tea light holder.jpeg", gallery: ["assets/images/Golden flower tea light holder.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["diwali", "gold", "flower", "tealight", "holder", "lotus"],
    material: null, dimensions: null, customizationAvailable: false
  },
  {
    id: "p-levitating-lotus-light", slug: "levitating-lotus-light", name: "Levitating Lotus Light",
    category: "diwali-collection", featured: false, alt: "Three lotus-shaped lights in different colors, each with a glowing center",
    shortDescription: "A lotus-shaped light with layered petals and a bright center.",
    description: "A sculpted lotus design frames a glowing center for a soft decorative accent. Ask us about the color options shown in the photo.",
    image: "assets/images/Levitating lotus.jpeg", gallery: ["assets/images/Levitating lotus.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["diwali", "lotus", "light", "lamp", "festive", "decor"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-lotus-flower-tealight-lamp", slug: "lotus-flower-tealight-lamp", name: "Lotus Flower Tealight Lamp",
    category: "diwali-collection", featured: false, alt: "White lotus-shaped lamp with layered petals and a glowing light inside",
    shortDescription: "A layered white lotus lamp with a softly glowing center.",
    description: "A white lotus-inspired lamp with overlapping petals that frame the light. A simple centerpiece for a festive table or quiet corner.",
    image: "assets/images/Lotus flower tea light lamp.jpeg", gallery: ["assets/images/Lotus flower tea light lamp.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["diwali", "lotus", "flower", "tealight", "lamp", "festive"],
    material: null, dimensions: null, customizationAvailable: false
  },
  {
    id: "p-lotus-mandala-wall-decor", slug: "lotus-mandala-wall-decor", name: "Lotus Mandala Wall Decor",
    category: "diwali-collection", featured: false, alt: "Round layered lotus mandala wall decor in white and pale green over a lavender background",
    shortDescription: "A detailed lotus mandala design for a festive wall or display.",
    description: "An ornamental round piece with layered lotus motifs and fine geometric details. Ask us about display options and available colors.",
    image: "assets/images/Mandala.jpeg", gallery: ["assets/images/Mandala.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["diwali", "mandala", "lotus", "wall decor", "festive", "ornament"],
    material: null, dimensions: null, customizationAvailable: true
  },
  {
    id: "p-modular-lantern", slug: "modular-lantern", name: "Modular Lantern",
    category: "diwali-collection", featured: false, alt: "Dark modular lantern with patterned sides, a peaked top and a circular hanging loop",
    shortDescription: "A patterned lantern with a classic peaked top and hanging loop.",
    description: "A lantern-style decor piece with geometric cutout panels, a peaked roof and a top loop. Contact us to confirm the size and lighting options.",
    image: "assets/images/The modular lantern.jpeg", gallery: ["assets/images/The modular lantern.jpeg"],
    price: null, priceType: "on-request", currency: "INR",
    tags: ["diwali", "lantern", "modular", "light", "festive", "decor"],
    material: null, dimensions: null, customizationAvailable: true
  }
];
