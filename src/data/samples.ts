import { SavedItinerary } from "../firebase";

export const SAMPLE_ITINERARIES: SavedItinerary[] = [
  {
    id: "sample-tokyo",
    userId: "curated-sample",
    createdAt: Date.now(),
    destination: "Tokyo, Japan",
    lat: 35.6762,
    lng: 139.6503,
    summary: "A thrilling fusion of ultra-modern skyscrapers, neon lights, and ancient spiritual temples. Experience the very best of Tokyo's historic neighborhoods, pop culture hubs, and culinary delights in this compact 3-day exploration.",
    days: [
      {
        dayNumber: 1,
        foodTip: "Try the world-famous hot ramen at Ichiran in Shibuya or savor fresh standing-bar sushi near the Tsukiji Outer Market!",
        morning: {
          title: "Senso-ji Temple & Nakamise-dori",
          description: "Explore Tokyo's oldest and most iconic Buddhist temple in Asakusa. Walk under the grand Kaminarimon Gate and shop for traditional snacks and souvenirs along the historic Nakamise shopping street.",
          locationName: "Senso-ji Temple, Asakusa, Tokyo",
          latitude: 35.7148,
          longitude: 139.7967
        },
        afternoon: {
          title: "Akihabara Electric Town Tour",
          description: "Dive deep into the capital of anime, manga, and retro gaming culture. Browse multi-story electronics department stores, specialty shops, and experience the quirky side of modern Japanese pop culture.",
          locationName: "Akihabara Station Area, Chiyoda, Tokyo",
          latitude: 35.6997,
          longitude: 139.7715
        },
        evening: {
          title: "Shibuya Crossing & Shibuya Sky Sunset",
          description: "Cross the world's busiest pedestrian scramble. Then, ascend to Shibuya Sky, an outdoor observation deck 229 meters above Shibuya, for breathtaking 360-degree twilight views over the Tokyo skyline.",
          locationName: "Shibuya Crossing, Tokyo",
          latitude: 35.6585,
          longitude: 139.7013
        }
      },
      {
        dayNumber: 2,
        foodTip: "Grab a freshly baked, warm sweet Melonpan in Harajuku, or tuck into smoky skewered yakitori inside the nostalgic Shinjuku alleys.",
        morning: {
          title: "Meiji Jingu Shrine & Yoyogi Park",
          description: "Stroll through a dense, tranquil forest in the center of Tokyo to visit Meiji Jingu, a majestic Shinto shrine dedicated to Emperor Meiji and Empress Shoken. Experience the peaceful contrast with the surrounding metropolis.",
          locationName: "Meiji Jingu Shrine, Shibuya, Tokyo",
          latitude: 35.6764,
          longitude: 139.6993
        },
        afternoon: {
          title: "Harajuku Takeshita Street & Omotesando",
          description: "Walk down Takeshita Street, the birthplace of Japan's kawaii fashion and colorful street foods (like loaded crepes). Transition into the upscale Omotesando boulevard for tree-lined avenues and striking modern architecture.",
          locationName: "Takeshita Street, Harajuku, Tokyo",
          latitude: 35.6715,
          longitude: 139.7032
        },
        evening: {
          title: "Shinjuku Omoide Yokocho & Kabukicho",
          description: "Enjoy dinner in Omoide Yokocho (Memory Lane), a grid of tiny alleys filled with lantern-lit izakayas. Afterwards, take a walk under the glowing neon lights of Kabukicho to see the giant Godzilla head.",
          locationName: "Omoide Yokocho, Shinjuku, Tokyo",
          latitude: 35.6929,
          longitude: 139.6994
        }
      },
      {
        dayNumber: 3,
        foodTip: "Savor a premium seafood donburi (rice bowl) for breakfast at Toyosu, and try delicious Monjayaki in Tsukishima for dinner!",
        morning: {
          title: "Toyosu Market & Tsukiji Outer Market",
          description: "Start your morning at Toyosu, the state-of-the-art wholesale fish market. Follow it up with a visit to the historic Tsukiji Outer Market to sample street foods, high-quality dashi broths, and fresh tamagoyaki.",
          locationName: "Tsukiji Outer Market, Chuo, Tokyo",
          latitude: 35.6444,
          longitude: 139.7821
        },
        afternoon: {
          title: "teamLab Planets TOKYO Exhibition",
          description: "Experience teamLab Planets, an immersive digital museum where visitors walk barefoot through water and interact with mesmerizing projections of floating orchids, infinite crystal spaces, and blooming digital gardens.",
          locationName: "teamLab Planets, Toyosu, Tokyo",
          latitude: 35.6433,
          longitude: 139.7900
        },
        evening: {
          title: "Odaiba Seaside Park & Rainbow Bridge",
          description: "Conclude your Tokyo adventure on the artificial island of Odaiba. Enjoy stunning bay-front night views of the lit-up Rainbow Bridge, Tokyo's miniature Statue of Liberty replica, and futuristic malls.",
          locationName: "Odaiba Seaside Park, Minato, Tokyo",
          latitude: 35.6293,
          longitude: 139.7764
        }
      }
    ]
  },
  {
    id: "sample-rome",
    userId: "curated-sample",
    createdAt: Date.now(),
    destination: "Rome, Italy",
    lat: 41.9028,
    lng: 12.4964,
    summary: "Step back into the ancient cradle of Western civilization. Explore colossal Roman amphitheaters, legendary baroque fountains, sacred Vatican art, and taste rich, traditional Italian culinary masterworks.",
    days: [
      {
        dayNumber: 1,
        foodTip: "Try classic Roman Pasta alla Carbonara or Tonnarelli Cacio e Pepe at a neighborhood osteria, and grab a crispy slice of Roman pizza al taglio!",
        morning: {
          title: "The Colosseum Guided Exploration",
          description: "Walk through the monumental ruins of the world's largest ancient amphitheater. Learn about the legendary lives of Roman gladiators, emperor battles, and the sophisticated architectural design behind the Colosseum.",
          locationName: "Colosseum, Rome, Italy",
          latitude: 41.8902,
          longitude: 12.4922
        },
        afternoon: {
          title: "Roman Forum & Palatine Hill",
          description: "Wander through the political, legal, and social heart of the Roman Empire. Stand among ancient temple columns, triumphal arches, and climb the Palatine Hill for imperial palace ruins and panoramic vistas.",
          locationName: "Roman Forum, Rome, Italy",
          latitude: 41.8922,
          longitude: 12.4853
        },
        evening: {
          title: "Trevi Fountain Coin Toss & Twilight Stroll",
          description: "Visit Rome's most famous baroque water monument at dusk. Toss a coin into the shimmering waters of the Trevi Fountain to guarantee your return to Rome, then wander the cobblestone streets nearby.",
          locationName: "Trevi Fountain, Rome, Italy",
          latitude: 41.9009,
          longitude: 12.4833
        }
      },
      {
        dayNumber: 2,
        foodTip: "Treat yourself to a cup of premium artisanal pistachio gelato from Frigidarium or Giolitti, just minutes away from Piazza Navona.",
        morning: {
          title: "Vatican Museums & Sistine Chapel",
          description: "Admire one of the greatest art collections in human history. Marvel at ancient classical sculptures, grand Renaissance tapestries, and stand in awe under Michelangelo's magnificent ceiling frescoes inside the Sistine Chapel.",
          locationName: "Vatican Museums, Vatican City",
          latitude: 41.9060,
          longitude: 12.4544
        },
        afternoon: {
          title: "St. Peter's Basilica & Square",
          description: "Enter the spiritual core of the Catholic world. Witness Michelangelo's touching Pietà sculpture, Bernini's imposing bronze baldacchino, and climb to the top of the monumental dome for unmatched views over Rome.",
          locationName: "St. Peter's Basilica, Vatican City",
          latitude: 41.9022,
          longitude: 12.4539
        },
        evening: {
          title: "Piazza Navona & Fountains at Dusk",
          description: "Unwind at Piazza Navona, built on the former Stadium of Domitian. Admire Bernini's spectacular Fountain of the Four Rivers, and watch talented street artists, musicians, and performers create an unforgettable atmosphere.",
          locationName: "Piazza Navona, Rome, Italy",
          latitude: 41.8989,
          longitude: 12.4731
        }
      },
      {
        dayNumber: 3,
        foodTip: "Grab a morning double espresso at the historic Antico Caffè Greco, or try Pompi's legendary wild strawberry tiramisu near the Steps!",
        morning: {
          title: "The Pantheon Historic Tour",
          description: "Visit the best-preserved ancient monument in Rome. Walk under its massive concrete dome, still the largest unreinforced dome in the world, and marvel at the sunlight pouring through the central oculus.",
          locationName: "Pantheon, Rome, Italy",
          latitude: 41.8986,
          longitude: 12.4769
        },
        afternoon: {
          title: "Villa Borghese Gardens & Galleria",
          description: "Escape the city bustle inside the lush English-style Villa Borghese landscape gardens. Walk around the lake, rent a bike, or view beautiful works of Bernini and Caravaggio inside the Galleria Borghese.",
          locationName: "Villa Borghese, Rome, Italy",
          latitude: 41.9131,
          longitude: 12.4862
        },
        evening: {
          title: "Spanish Steps & High Fashion Walks",
          description: "Conclude your Roman holiday at the elegant Spanish Steps. Admire the Barcaccia fountain, sit and observe the bustling atmosphere, and enjoy some premium window shopping along the fashionable Via dei Condotti.",
          locationName: "Spanish Steps, Rome, Italy",
          latitude: 41.9057,
          longitude: 12.4823
        }
      }
    ]
  },
  {
    id: "sample-paris",
    userId: "curated-sample",
    createdAt: Date.now(),
    destination: "Paris, France",
    lat: 48.8566,
    lng: 2.3522,
    summary: "Discover the city of love, fashion, and culinary masterpieces. Admire world-class masterpieces at the Louvre, catch spectacular Eiffel Tower light displays, explore bohemian Montmartre, and dine in romantic bistros.",
    days: [
      {
        dayNumber: 1,
        foodTip: "Grab a flaky, warm butter croissant or pain au chocolat from a traditional boulangerie like Du Pain et des Idées for a perfect Parisian start!",
        morning: {
          title: "Eiffel Tower Ascent & Champ de Mars",
          description: "Ascend the Eiffel Tower, the ultimate symbol of France. Take in glorious birds-eye views over the river Seine and the surrounding classical avenues. Stroll across the green lawns of the Champ de Mars afterwards.",
          locationName: "Eiffel Tower, Paris, France",
          latitude: 48.8584,
          longitude: 2.2945
        },
        afternoon: {
          title: "Seine River Cruise & Luxembourg Gardens",
          description: "Board a glass-topped boat for an informative cruise on the Seine. Float past the historic Orsay Museum, Louvre, and Notre-Dame. Afterwards, stroll through the tree-lined pathways of the French Senate's Luxembourg Gardens.",
          locationName: "Jardin du Luxembourg, Paris, France",
          latitude: 48.8462,
          longitude: 2.3371
        },
        evening: {
          title: "Arc de Triomphe & Champs-Élysées",
          description: "Walk down the grand Avenue des Champs-Élysées. Climb to the top of the iconic Arc de Triomphe for stunning sunset views of the 12 radiating avenues meeting at the star-shaped Place de l'Étoile.",
          locationName: "Arc de Triomphe, Paris, France",
          latitude: 48.8738,
          longitude: 2.2950
        }
      },
      {
        dayNumber: 2,
        foodTip: "Indulge in a hot, hand-spun savory galette or sweet Nutella-banana crepe from a neighborhood street-cart inside the historic Marais.",
        morning: {
          title: "The Louvre Museum Art Treasures",
          description: "Explore the world's largest art museum. Wander through monumental galleries to view legendary treasures, including Leonardo da Vinci's Mona Lisa, the Venus de Milo, and the Winged Victory of Samothrace.",
          locationName: "Musée du Louvre, Paris, France",
          latitude: 48.8606,
          longitude: 2.3376
        },
        afternoon: {
          title: "Tuileries Gardens & Place de la Concorde",
          description: "Stroll out of the Louvre pyramid into the historical Tuileries Garden. Relax on one of the iconic green metal chairs by the fountains, then exit onto Place de la Concorde to admire the towering Luxor Obelisk.",
          locationName: "Tuileries Garden, Paris, France",
          latitude: 48.8656,
          longitude: 2.3211
        },
        evening: {
          title: "Le Marais District Walking Tour",
          description: "Experience the historical, artistic, and trendy vibes of Le Marais. Admire beautifully preserved medieval and Renaissance-era mansions, browse local boutiques, and dine at a cozy French bistro.",
          locationName: "Le Marais, Paris, France",
          latitude: 48.8589,
          longitude: 2.3611
        }
      },
      {
        dayNumber: 3,
        foodTip: "Pamper yourself with delicate, colorful French macarons from the luxurious Pierre Hermé or Ladurée boutique salons.",
        morning: {
          title: "Sacré-Cœur Basilica & Montmartre Alleys",
          description: "Explore the historic hilltop bohemian neighborhood of Montmartre. Visit the white-domed Sacré-Cœur Basilica, watch local painters create masterpieces at Place du Tertre, and walk down the charming ivy-draped streets.",
          locationName: "Sacré-Cœur Basilica, Montmartre, Paris",
          latitude: 48.8867,
          longitude: 2.3431
        },
        afternoon: {
          title: "Musée d'Orsay Impressionist Art",
          description: "Visit the Musée d'Orsay, uniquely housed inside a magnificent former Beaux-Arts railway station. View the world's finest collection of Impressionist masterpieces by Monet, Van Gogh, Renoir, and Degas.",
          locationName: "Musée d'Orsay, Paris, France",
          latitude: 48.8599,
          longitude: 2.3265
        },
        evening: {
          title: "Sainte-Chapelle & Notre-Dame Square",
          description: "Gaze at the jaw-dropping stained-glass windows of Sainte-Chapelle, representing over 1,113 scenes from the Bible. Then walk over to Notre-Dame Cathedral's front square to pay tribute to the Gothic landmark.",
          locationName: "Sainte-Chapelle, Paris, France",
          latitude: 48.8530,
          longitude: 2.3499
        }
      }
    ]
  }
];
