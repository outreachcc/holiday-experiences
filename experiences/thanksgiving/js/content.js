window.STORY = {
  "event": {
    "title": "The Thanksgiving Experience",
    "season": "thanksgiving",
    "tagline": "Enter His gates with thanksgiving",
    "church": "Outreach Christian Church",
    "city": "Coraopolis, PA",
    "website": "https://theoutreachcc.com",
    "websiteLabel": "TheOutreachCC.com",
    "serviceTimes": "Sundays at 10:00 AM",
    "address": "",
    "special": ""
  },
  "cast": {
    "narrator": "af_heart",
    "david": "am_liam+am_michael",
    "moses": "bm_george+am_onyx",
    "lepers": [
      "am_fenrir",
      "am_puck",
      "bm_george"
    ],
    "jesus": "am_michael+am_fenrir",
    "andrew": "am_eric",
    "paul": "bm_lewis+bm_daniel",
    "healed1": "am_puck",
    "healed2": "am_fenrir"
  },
  "clips": {
    "lepers.healed1": {
      "voice": "healed1",
      "text": "Look! My hands are clean!",
      "mood": "excited"
    },
    "lepers.healed2": {
      "voice": "healed2",
      "text": "I'm healed! I'm healed!",
      "mood": "excited"
    }
  },
  "stations": [
    {
      "id": "gates",
      "num": 1,
      "title": "Enter His Gates",
      "subtitle": "A song of thanksgiving",
      "light": "harvest",
      "steps": [
        {
          "say": "Welcome to the Thanksgiving Experience! Every November, families all across America sit down together to give thanks. In 1621, the Pilgrims held a harvest feast to thank God for bringing them through a hard first year in a new land, and they shared it with their Wampanoag neighbors."
        },
        {
          "say": "But giving thanks to God is much, much older than that. Three thousand years ago, a shepherd boy who grew up to be a king wrote songs of thanks. His name was David."
        },
        {
          "say": "David loved to play the harp and sing to God. Tap the harp to hear his song!",
          "task": "harp",
          "prompt": "Tap the harp",
          "verse": {
            "text": "Make a joyful noise unto the LORD, all ye lands. Serve the LORD with gladness: come before his presence with singing.",
            "ref": "Psalm 100:1-2",
            "voice": "david",
            "mood": "joy",
            "spoken": "Make a joyful noise unto the LORD, all ye lands! Serve the LORD with gladness: come before his presence with singing!"
          },
          "after": "David wanted the whole world to sing to God, gladly!"
        },
        {
          "say": "In Jerusalem, people came in through the city gates to worship God. David told them how to come in. Tap the gates to open them!",
          "task": "gates",
          "prompt": "Tap the city gates",
          "verse": {
            "text": "Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.",
            "ref": "Psalm 100:4",
            "voice": "david",
            "mood": "joy",
            "spoken": "Enter into his gates with thanksgiving, and into his courts with praise! Be thankful unto him, and bless his name!"
          },
          "after": "Thanksgiving is how we come close to God. A thankful heart opens the door.",
          "light": "star"
        },
        {
          "say": "And here is the reason we give thanks. It is a song God's people still sing today.",
          "verse": {
            "text": "O give thanks unto the LORD, for he is good: for his mercy endureth for ever.",
            "ref": "Psalm 107:1",
            "voice": "david",
            "mood": "joy",
            "spoken": "O give thanks unto the LORD, for he is good! For his mercy endureth for ever!"
          },
          "light": "celebrate",
          "end": true,
          "after": "That is what Thanksgiving is really about. God is good, and His mercy lasts forever!"
        }
      ]
    },
    {
      "id": "manna",
      "num": 2,
      "title": "Bread from Heaven",
      "subtitle": "In the wilderness",
      "light": "night",
      "steps": [
        {
          "say": "God rescued His people from slavery in Egypt and led them out into the desert. But in the wilderness there was no food, and soon the people began to grumble and complain."
        },
        {
          "say": "God heard them. He told Moses that bread would come down from heaven, fresh every morning. Tap the sky to bring the morning!",
          "task": "dawn",
          "prompt": "Tap the sky",
          "verse": {
            "text": "And Moses said unto them, This is the bread which the LORD hath given you to eat.",
            "ref": "Exodus 16:15",
            "speak": [
              [
                "narrator",
                "And Moses said unto them,"
              ],
              [
                "moses",
                "This is the bread which the LORD hath given you to eat.",
                "This is the bread which the LORD hath given you to eat!",
                "joy"
              ]
            ]
          },
          "after": "The people called it manna. It tasted sweet, like wafers made with honey, and there was enough for everyone.",
          "light": "harvest"
        },
        {
          "say": "Every morning, each family gathered just what they needed for that day. Tap the basket to gather the manna!",
          "task": "gather",
          "prompt": "Tap the basket",
          "verse": {
            "text": "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
            "ref": "Lamentations 3:22-23",
            "mood": "awe",
            "spoken": "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness."
          },
          "after": "Just like the manna, every bite on your Thanksgiving table is a gift from God. Have you thanked Him for today?",
          "light": "celebrate",
          "end": true
        }
      ]
    },
    {
      "id": "lepers",
      "num": 3,
      "title": "The One Who Came Back",
      "subtitle": "Ten men are healed",
      "light": "journey",
      "steps": [
        {
          "say": "One day, Jesus was walking toward Jerusalem. Near a village, he saw ten men standing far away. They were sick with a disease called leprosy, and no one was allowed to come near them.",
          "verse": {
            "text": "And as he entered into a certain village, there met him ten men that were lepers, which stood afar off: And they lifted up their voices, and said, Jesus, Master, have mercy on us.",
            "ref": "Luke 17:12-13",
            "speak": [
              [
                "narrator",
                "And as he entered into a certain village, there met him ten men that were lepers, which stood afar off: And they lifted up their voices, and said,"
              ],
              [
                "lepers",
                "Jesus, Master, have mercy on us.",
                "Jesus, Master, have mercy on us!",
                "cry"
              ]
            ]
          }
        },
        {
          "say": "Jesus did not walk away. He looked at them with love, and he told them what to do.",
          "verse": {
            "text": "And when he saw them, he said unto them, Go shew yourselves unto the priests.",
            "ref": "Luke 17:14",
            "speak": [
              [
                "narrator",
                "And when he saw them, he said unto them,"
              ],
              [
                "jesus",
                "Go shew yourselves unto the priests.",
                "Go, shew yourselves unto the priests.",
                "earnest"
              ]
            ]
          }
        },
        {
          "say": "The men were still sick, but they trusted Jesus and started down the road. Tap the men to send them on their way!",
          "task": "go",
          "prompt": "Tap the ten men",
          "after": "As they went, all ten of them were healed!",
          "light": "star"
        },
        {
          "say": "Nine of the men kept running, home to their families. But one of them stopped. Tap the man who turns back!",
          "task": "return",
          "prompt": "Tap the man who turns back",
          "verse": {
            "text": "And one of them, when he saw that he was healed, turned back, and with a loud voice glorified God, And fell down on his face at his feet, giving him thanks: and he was a Samaritan.",
            "ref": "Luke 17:15-16",
            "mood": "excited",
            "spoken": "And one of them, when he saw that he was healed, turned back, and with a loud voice glorified God! And fell down on his face at his feet, giving him thanks: and he was a Samaritan."
          }
        },
        {
          "say": "Jesus looked down the empty road.",
          "verse": {
            "text": "And Jesus answering said, Were there not ten cleansed? but where are the nine? There are not found that returned to give glory to God, save this stranger.",
            "ref": "Luke 17:17-18",
            "speak": [
              [
                "narrator",
                "And Jesus answering said,"
              ],
              [
                "jesus",
                "Were there not ten cleansed? but where are the nine? There are not found that returned to give glory to God, save this stranger.",
                "Were there not ten cleansed? But where are the nine? There are not found that returned to give glory to God, save this stranger.",
                "sorrow"
              ]
            ]
          }
        },
        {
          "verse": {
            "text": "And he said unto him, Arise, go thy way: thy faith hath made thee whole.",
            "ref": "Luke 17:19",
            "speak": [
              [
                "narrator",
                "And he said unto him,"
              ],
              [
                "jesus",
                "Arise, go thy way: thy faith hath made thee whole.",
                "Arise, go thy way. Thy faith hath made thee whole.",
                "tender"
              ]
            ]
          },
          "after": "Ten men were healed, but only one came back to say thank you. This Thanksgiving, think of someone who has blessed you. Go back and thank them, and thank God too!",
          "light": "celebrate",
          "end": true
        }
      ]
    },
    {
      "id": "loaves",
      "num": 4,
      "title": "Loaves and Fishes",
      "subtitle": "A little becomes a lot",
      "light": "harvest",
      "steps": [
        {
          "say": "Another day, a huge crowd followed Jesus up a hillside by the Sea of Galilee. More than five thousand people! It was getting late, everyone was hungry, and there was nowhere to buy food."
        },
        {
          "say": "Jesus' friend Andrew found a boy who had brought his lunch. Tap the boy's basket to see what was inside!",
          "task": "lunch",
          "prompt": "Tap the boy's basket",
          "verse": {
            "text": "There is a lad here, which hath five barley loaves, and two small fishes: but what are they among so many?",
            "ref": "John 6:9",
            "voice": "andrew",
            "mood": "doubt"
          },
          "after": "It wasn't much. But the boy gave all of it to Jesus."
        },
        {
          "say": "Jesus had everyone sit down on the green grass. Then he held up the bread, and before he did anything else, he did something very important.",
          "verse": {
            "text": "And Jesus took the loaves; and when he had given thanks, he distributed to the disciples, and the disciples to them that were set down; and likewise of the fishes as much as they would.",
            "ref": "John 6:11",
            "mood": "awe"
          },
          "after": "Did you hear it? Before anyone ate, Jesus gave thanks. That is why so many families pray before their Thanksgiving dinner."
        },
        {
          "say": "Now tap the basket to share the food with everyone!",
          "task": "share",
          "prompt": "Tap the basket",
          "after": "There was enough for every single person. Everyone ate until they were full!"
        },
        {
          "verse": {
            "text": "When they were filled, he said unto his disciples, Gather up the fragments that remain, that nothing be lost.",
            "ref": "John 6:12",
            "speak": [
              [
                "narrator",
                "When they were filled, he said unto his disciples,"
              ],
              [
                "jesus",
                "Gather up the fragments that remain, that nothing be lost.",
                "Gather up the fragments that remain, that nothing be lost.",
                "tender"
              ]
            ]
          }
        },
        {
          "say": "Let's see how much was left over. Tap to gather up the leftovers!",
          "task": "baskets",
          "prompt": "Tap to gather the leftovers",
          "verse": {
            "text": "Therefore they gathered them together, and filled twelve baskets with the fragments of the five barley loaves, which remained over and above unto them that had eaten.",
            "ref": "John 6:13",
            "mood": "excited",
            "spoken": "Therefore they gathered them together, and filled twelve baskets with the fragments of the five barley loaves, which remained over and above unto them that had eaten!"
          },
          "after": "Jesus gave thanks for one small lunch, and God made it more than enough. When we thank God for what we have, He can do more than we can imagine.",
          "light": "celebrate",
          "end": true
        }
      ]
    },
    {
      "id": "midnight",
      "num": 5,
      "title": "Songs at Midnight",
      "subtitle": "Thankful in every thing",
      "light": "night",
      "steps": [
        {
          "say": "Paul and his friend Silas traveled far and wide to tell people about Jesus. But in the city of Philippi, they were beaten and thrown into prison. Their feet were locked tight in wooden stocks."
        },
        {
          "say": "It was dark. They were hurting. They didn't know what would happen next. So what did they do? Tap Paul and Silas to find out!",
          "task": "sing",
          "prompt": "Tap Paul and Silas",
          "verse": {
            "text": "And at midnight Paul and Silas prayed, and sang praises unto God: and the prisoners heard them.",
            "ref": "Acts 16:25",
            "mood": "awe"
          },
          "light": "candle"
        },
        {
          "say": "And then, God did something amazing. Press GO to see what happened!",
          "task": "quake",
          "prompt": "Press GO",
          "verse": {
            "text": "And suddenly there was a great earthquake, so that the foundations of the prison were shaken: and immediately all the doors were opened, and every one's bands were loosed.",
            "ref": "Acts 16:26",
            "mood": "excited",
            "spoken": "And suddenly there was a great earthquake! So that the foundations of the prison were shaken: and immediately all the doors were opened, and every one's bands were loosed!"
          },
          "after": "That very night, the jailer and his whole family believed in Jesus!",
          "light": "celebrate"
        },
        {
          "say": "Later, Paul wrote letters to the churches. Even when life was hard, he told them this.",
          "verse": {
            "text": "In every thing give thanks: for this is the will of God in Christ Jesus concerning you.",
            "ref": "1 Thessalonians 5:18",
            "voice": "paul",
            "mood": "earnest",
            "spoken": "In every thing give thanks! For this is the will of God in Christ Jesus concerning you."
          },
          "after": "Not just when things are good. In every thing!",
          "light": "candle"
        },
        {
          "say": "Paul also told them what to do with their worries.",
          "verse": {
            "text": "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
            "ref": "Philippians 4:6",
            "voice": "paul",
            "mood": "tender"
          },
          "after": "Be careful for nothing means, don't worry about anything. Tell God what you need, and thank Him while you ask.",
          "light": "candle"
        },
        {
          "say": "God's people have lived this out in hard times ever since. The Pilgrims' first winter in America was so cold and so hard that about half of them died. Yet when autumn came, they still gave thanks to God.",
          "light": "night"
        },
        {
          "say": "And in 1863, in the middle of the Civil War, President Abraham Lincoln asked the whole nation to set apart the last Thursday of November as a day of Thanksgiving and Praise to God. Americans have celebrated Thanksgiving every November since.",
          "light": "celebrate",
          "end": true
        }
      ]
    },
    {
      "id": "tree",
      "num": 6,
      "title": "Count Your Blessings",
      "subtitle": "The Thankful Tree",
      "light": "harvest",
      "steps": [
        {
          "say": "Look around your Thanksgiving table. Your family and friends. The food in front of you. A warm place to sleep tonight. Every one of them is a gift from God.",
          "verse": {
            "text": "Every good gift and every perfect gift is from above, and cometh down from the Father of lights, with whom is no variableness, neither shadow of turning.",
            "ref": "James 1:17",
            "mood": "warm"
          }
        },
        {
          "say": "Think of one thing you are thankful for. Then tap the tree to add a golden leaf of thanks!",
          "task": "leaf",
          "prompt": "Tap the tree to add your leaf",
          "after": "Every leaf on this tree is someone saying thank you to God."
        },
        {
          "say": "But there is one gift that is bigger than all the rest. God gave us His Son, Jesus, so that we could be part of His family forever.",
          "verse": {
            "text": "Thanks be unto God for his unspeakable gift.",
            "ref": "2 Corinthians 9:15",
            "mood": "joy",
            "spoken": "Thanks be unto God for his unspeakable gift!"
          },
          "after": "Unspeakable means a gift so wonderful that words can't describe it.",
          "light": "candle"
        },
        {
          "say": "Let's thank God together, with a song Christians have been singing for more than three hundred years.",
          "music": "doxology",
          "light": "candle"
        },
        {
          "say": "Thank you for giving thanks with us. We would love to see you again. Happy Thanksgiving!",
          "invite": true,
          "light": "celebrate",
          "end": true
        }
      ]
    }
  ],
  "carols": [
    {
      "id": "doxology",
      "title": "The Doxology",
      "credit": "Thomas Ken, 1674 / Old Hundredth, 1551",
      "tempo": 0.27,
      "file": "",
      "phrases": [
        {
          "line": "Praise God, from whom all blessings flow;",
          "sing": "Praise God, from whom all bless- ings flow;",
          "notes": "G4:4 G4:2 F#4:2 E4:2 D4:2 G4:2 A4:2 B4:4 R:2"
        },
        {
          "line": "Praise Him, all creatures here below;",
          "sing": "Praise Him, all crea- tures here be- low;",
          "notes": "B4:4 B4:2 B4:2 A4:2 G4:2 C5:2 B4:2 A4:4 R:2"
        },
        {
          "line": "Praise Him above, ye heavenly host;",
          "sing": "Praise Him a- bove, ye heav- enly host;",
          "notes": "G4:4 A4:2 B4:2 A4:2 G4:2 E4:2 F#4:2 G4:4 R:2"
        },
        {
          "line": "Praise Father, Son, and Holy Ghost.",
          "sing": "Praise Fa- ther, Son, and Ho- ly Ghost.",
          "notes": "D5:4 B4:2 G4:2 A4:2 C5:2 B4:2 A4:2 G4:6 R:2"
        },
        {
          "line": "Amen.",
          "sing": "A- men.",
          "notes": "G4:5 G4:8"
        }
      ]
    }
  ]
};
