window.STORY = {
  "event": {
    "title": "The Christmas Experience",
    "season": "christmas",
    "tagline": "Walk the road to Bethlehem",
    "church": "Outreach Christian Church",
    "city": "Coraopolis, PA",
    "website": "https://theoutreachcc.com",
    "websiteLabel": "TheOutreachCC.com",
    "serviceTimes": "Sundays at 10:00 AM",
    "address": "",
    "christmasEve": ""
  },
  "cast": {
    "narrator": "af_heart",
    "isaiah": "am_onyx+am_fenrir",
    "micah": "am_echo+am_michael",
    "gabriel": "am_michael",
    "mary": "af_bella",
    "angel": "am_fenrir",
    "choir": ["af_bella", "af_heart", "am_michael", "am_fenrir"],
    "wiseman": "bm_fable",
    "jesus": "am_michael+am_fenrir",
    "innkeeper1": "am_puck",
    "innkeeper2": "af_sarah",
    "innkeeper3": "bm_george"
  },
  "clips": {
    "journey.door1": { "voice": "innkeeper1", "text": "Sorry, no room! Every bed is taken." },
    "journey.door2": { "voice": "innkeeper2", "text": "We're full up! Try down the street." },
    "journey.door3": { "voice": "innkeeper3", "text": "No room in the inn... but you may stay in my stable." },
    "promise.1.ref": { "voice": "narrator", "text": "Isaiah 7, verse 14." },
    "promise.2.ref": { "voice": "narrator", "text": "Micah 5, verse 2." },
    "promise.3.ref": { "voice": "narrator", "text": "Isaiah 9, verse 6." },
    "promise.4.ref": { "voice": "narrator", "text": "Isaiah 9, verse 2." }
  },
  "stations": [
    {
      "id": "promise",
      "num": 1,
      "title": "The Promise",
      "subtitle": "A world waiting in the dark",
      "light": "night",
      "steps": [
        {
          "say": "Long, long ago, before the very first Christmas, the world was waiting. People felt like they were walking in the dark. But God had made a promise, and He always keeps His promises.",
          "prompt": "Press GO to begin"
        },
        {
          "say": "God sent messengers called prophets to tell the people what was coming. Let's light the stars and hear what they said. Tap the first star!",
          "task": "star1",
          "prompt": "Tap the glowing star",
          "verse": { "text": "Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel.", "ref": "Isaiah 7:14", "voice": "isaiah" },
          "after": "Immanuel means, God with us. God himself was coming to be with His people!",
          "light": "star"
        },
        {
          "say": "The prophet Micah even told them which town to watch. Tap the second star!",
          "task": "star2",
          "prompt": "Tap the glowing star",
          "verse": { "text": "But thou, Bethlehem Ephratah, though thou be little among the thousands of Judah, yet out of thee shall he come forth unto me that is to be ruler in Israel.", "ref": "Micah 5:2", "voice": "micah" },
          "after": "Bethlehem was a tiny town. But God loves to do big things in small places.",
          "light": "star"
        },
        {
          "say": "And Isaiah told them who this child would be. Tap the brightest star of all!",
          "task": "star3",
          "prompt": "Tap the glowing star",
          "verse": { "text": "For unto us a child is born, unto us a son is given: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace.", "ref": "Isaiah 9:6", "voice": "isaiah" },
          "after": "People waited hundreds of years for this promise. Keep walking, and see how God kept it.",
          "light": "star"
        },
        {
          "say": "Hundreds of years later, God was about to keep every one of those promises. Isaiah said it like this.",
          "verse": { "text": "The people that walked in darkness have seen a great light: they that dwell in the land of the shadow of death, upon them hath the light shined.", "ref": "Isaiah 9:2", "voice": "isaiah" },
          "light": "celebrate",
          "end": true
        }
      ]
    },
    {
      "id": "mary",
      "num": 2,
      "title": "An Angel Visits Mary",
      "subtitle": "Nazareth",
      "light": "manger",
      "steps": [
        {
          "say": "In a little town called Nazareth lived a young woman named Mary. She was engaged to marry a carpenter named Joseph. One ordinary day, something extraordinary happened.",
          "prompt": "Press GO to see what happened"
        },
        {
          "say": "Someone had come to visit Mary. Tap the window to see who it was!",
          "task": "angel",
          "prompt": "Tap the window",
          "verse": { "text": "And the angel said unto her, Fear not, Mary: for thou hast found favour with God. And, behold, thou shalt bring forth a son, and shalt call his name JESUS.", "ref": "Luke 1:30-31", "speak": [["narrator", "And the angel said unto her,"], ["gabriel", "Fear not, Mary: for thou hast found favour with God. And, behold, thou shalt bring forth a son, and shalt call his name JESUS."]] },
          "after": "It was the angel Gabriel, sent by God himself, with the most surprising news in the world.",
          "light": "angel"
        },
        {
          "say": "Mary wondered how this could ever happen. The angel gave her an answer that is still true today.",
          "verse": { "text": "For with God nothing shall be impossible.", "ref": "Luke 1:37", "voice": "gabriel" },
          "after": "Nothing is impossible with God. Not for Mary, and not for you."
        },
        {
          "say": "Now it was Mary's turn to answer. Tap the heart to hear what she said.",
          "task": "heart",
          "prompt": "Tap the heart",
          "verse": { "text": "Behold the handmaid of the Lord; be it unto me according to thy word.", "ref": "Luke 1:38", "voice": "mary" },
          "after": "Mary trusted God and said yes. What would you say if God asked you?",
          "light": "celebrate",
          "end": true
        }
      ]
    },
    {
      "id": "journey",
      "num": 3,
      "title": "The Road to Bethlehem",
      "subtitle": "A long journey",
      "light": "journey",
      "steps": [
        {
          "say": "The ruler Caesar Augustus ordered everyone to be counted in their family's hometown. So Joseph and Mary had to travel all the way to Bethlehem.",
          "verse": { "text": "And Joseph also went up from Galilee, out of the city of Nazareth, into Judaea, unto the city of David, which is called Bethlehem.", "ref": "Luke 2:4" },
          "prompt": "Press GO to start the journey"
        },
        {
          "say": "It was a long walk, about ninety miles, up and down rocky hills. Help them along! Keep pressing GO, or tap the road, to walk to Bethlehem.",
          "task": "walk",
          "prompt": "Press GO to walk!",
          "after": "At last! The lights of Bethlehem! But the town was crowded with travelers."
        },
        {
          "say": "Joseph needed a place to stay, and Mary's baby was coming soon. Knock on the doors to find a room.",
          "task": "doors",
          "prompt": "Knock on a door",
          "verse": { "text": "There was no room for them in the inn.", "ref": "Luke 2:7" },
          "after": "There was no room anywhere. But one kind person offered the only space left: a stable, where the animals slept.",
          "light": "manger",
          "end": true
        }
      ]
    },
    {
      "id": "manger",
      "num": 4,
      "title": "Born in Bethlehem",
      "subtitle": "The first Christmas night",
      "light": "manger",
      "steps": [
        {
          "say": "That night, in a humble stable in Bethlehem, the promise came true. Let's set up the scene together.",
          "prompt": "Press GO to begin"
        },
        {
          "say": "Tap the glowing spots, or press GO, to add each part of the very first Christmas.",
          "task": "build",
          "prompt": "Tap the glowing spot",
          "verse": { "text": "And she brought forth her firstborn son, and wrapped him in swaddling clothes, and laid him in a manger.", "ref": "Luke 2:7" },
          "after": "The King of all creation was born, not in a palace, but in a stable. Jesus came for everyone, rich and poor, big and small.",
          "light": "manger"
        },
        {
          "say": "Listen closely. Can you imagine how quiet and holy that night must have been?",
          "music": "silent-night",
          "light": "candle",
          "end": true
        }
      ]
    },
    {
      "id": "shepherds",
      "num": 5,
      "title": "Shepherds and Angels",
      "subtitle": "Good news of great joy",
      "light": "night",
      "steps": [
        {
          "say": "Out in the fields near Bethlehem, shepherds were watching their sheep through the night. But some of the sheep have wandered off!",
          "prompt": "Press GO to help"
        },
        {
          "say": "Tap each wandering sheep to bring it back to the flock.",
          "task": "sheep",
          "prompt": "Tap the sheep",
          "after": "Good work! Every sheep is safe. Just then, the sky began to glow."
        },
        {
          "say": "An angel of the Lord appeared, and the glory of the Lord shone all around them. The shepherds were terrified! But the angel said,",
          "verse": { "text": "Fear not: for, behold, I bring you good tidings of great joy, which shall be to all people. For unto you is born this day in the city of David a Saviour, which is Christ the Lord.", "ref": "Luke 2:10-11", "voice": "angel" },
          "light": "angel"
        },
        {
          "say": "Suddenly the whole sky was filled with angels, praising God! Tap the sky to join the choir.",
          "task": "choir",
          "prompt": "Tap the sky",
          "verse": { "text": "Glory to God in the highest, and on earth peace, good will toward men.", "ref": "Luke 2:14", "voice": "choir" },
          "light": "celebrate"
        },
        {
          "say": "The shepherds couldn't wait. They left their fields and ran to see if it was really true.",
          "verse": { "text": "And they came with haste, and found Mary, and Joseph, and the babe lying in a manger.", "ref": "Luke 2:16" },
          "after": "It was just as the angel said! Then the shepherds told everyone what they had seen.",
          "end": true
        }
      ]
    },
    {
      "id": "magi",
      "num": 6,
      "title": "The Wise Men",
      "subtitle": "Follow the star",
      "light": "star",
      "steps": [
        {
          "say": "Far away in the East, wise men who studied the stars saw a brand new star in the sky. They knew it meant a great King had been born.",
          "verse": { "text": "Where is he that is born King of the Jews? for we have seen his star in the east, and are come to worship him.", "ref": "Matthew 2:2", "voice": "wiseman" },
          "prompt": "Press GO to follow the star"
        },
        {
          "say": "Their journey was long. Press GO, or tap the star, to keep the camels following it.",
          "task": "follow",
          "prompt": "Follow the star!",
          "verse": { "text": "When they saw the star, they rejoiced with exceeding great joy.", "ref": "Matthew 2:10" },
          "after": "The star stopped right over the house where the young child Jesus was. They had found him!",
          "light": "celebrate"
        },
        {
          "say": "The wise men bowed down and worshipped Jesus, and they opened their treasures. Tap each gift to see what it means.",
          "task": "gifts",
          "prompt": "Tap a gift",
          "verse": { "text": "They presented unto him gifts; gold, and frankincense, and myrrh.", "ref": "Matthew 2:11" },
          "after": "The wise men gave Jesus their very best. Jesus is still the King worth seeking today.",
          "end": true
        }
      ]
    },
    {
      "id": "gift",
      "num": 7,
      "title": "The Greatest Gift",
      "subtitle": "Christmas is for you",
      "light": "candle",
      "steps": [
        {
          "say": "Why did Jesus come? The Bible tells us, in one of its most famous verses.",
          "verse": { "text": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", "ref": "John 3:16" },
          "after": "Jesus is God's gift to the whole world. And that includes you.",
          "prompt": "Press GO to continue"
        },
        {
          "say": "Jesus called himself the light of the world. Light a candle to remember that his light is for you. Tap the candle!",
          "task": "candle",
          "prompt": "Tap to light your candle",
          "verse": { "text": "I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.", "ref": "John 8:12", "voice": "jesus" },
          "light": "candle"
        },
        {
          "say": "Thank you for walking the road to Bethlehem with us. Like the shepherds and the wise men, come and worship Him this Christmas. Merry Christmas!",
          "invite": true,
          "light": "celebrate",
          "end": true
        }
      ]
    }
  ],
  "carols": [
    {
      "id": "silent-night",
      "title": "Silent Night",
      "credit": "Joseph Mohr & Franz Gruber, 1818",
      "tempo": 0.32,
      "file": "",
      "phrases": [
        { "line": "Silent night, holy night,", "sing": "Si- lent _ night, ho- ly _ night,", "notes": "G4:3 A4:1 G4:2 E4:6 G4:3 A4:1 G4:2 E4:6" },
        { "line": "All is calm, all is bright", "sing": "All is calm, all is bright", "notes": "D5:4 D5:2 B4:6 C5:4 C5:2 G4:6" },
        { "line": "Round yon virgin mother and child.", "sing": "Round yon vir- gin _ mo- ther and child.", "notes": "A4:4 A4:2 C5:3 B4:1 A4:2 G4:3 A4:1 G4:2 E4:6" },
        { "line": "Holy infant so tender and mild,", "sing": "Ho- ly in- fant so ten- der and mild,", "notes": "A4:4 A4:2 C5:3 B4:1 A4:2 G4:3 A4:1 G4:2 E4:6" },
        { "line": "Sleep in heavenly peace,", "sing": "Sleep in heav- en- ly peace, _", "notes": "D5:4 D5:2 F5:3 D5:1 B4:2 C5:6 E5:6" },
        { "line": "Sleep in heavenly peace.", "sing": "Sleep in heav- en- ly peace. _", "notes": "C5:3 G4:1 E4:2 G4:3 F4:1 D4:2 C4:12" }
      ]
    },
    {
      "id": "joy-to-the-world",
      "title": "Joy to the World",
      "credit": "Isaac Watts, 1719 / Lowell Mason, 1839",
      "tempo": 0.15,
      "file": "",
      "phrases": [
        { "line": "Joy to the world! The Lord is come;", "notes": "D5:4 C#5:3 B4:1 A4:6 G4:2 F#4:4 E4:4 D4:6" },
        { "line": "Let earth receive her King;", "notes": "A4:2 B4:6 B4:2 C#5:6 C#5:2 D5:10 R:2" },
        { "line": "Let every heart prepare Him room,", "notes": "D5:2 D5:2 C#5:2 B4:2 A4:2 A4:3 G4:1 F#4:2 D5:2 D5:2 C#5:2 B4:2 A4:2 A4:3 G4:1 F#4:2" },
        { "line": "And heaven and nature sing,", "notes": "F#4:2 F#4:2 F#4:2 F#4:2 F#4:1 G4:1 A4:6" },
        { "line": "And heaven and nature sing,", "notes": "G4:1 F#4:1 E4:2 E4:2 E4:2 E4:1 F#4:1 G4:6" },
        { "line": "And heaven, and heaven, and nature sing.", "notes": "F#4:1 E4:1 D4:2 D5:4 B4:2 A4:3 G4:1 F#4:2 G4:2 F#4:4 E4:4 D4:8" }
      ]
    },
    {
      "id": "first-noel",
      "title": "The First Noel",
      "credit": "Traditional English carol",
      "tempo": 0.22,
      "file": "",
      "phrases": [
        { "line": "The first Noel the angels did say", "notes": "E4:1 D4:1 C4:3 D4:1 E4:1 F4:1 G4:4 A4:1 B4:1 C5:2 B4:2 A4:2 G4:4" },
        { "line": "Was to certain poor shepherds in fields as they lay;", "notes": "A4:1 B4:1 C5:2 B4:2 A4:2 G4:2 A4:2 B4:2 C5:2 G4:2 F4:2 E4:4" },
        { "line": "In fields where they lay keeping their sheep,", "notes": "E4:1 D4:1 C4:3 D4:1 E4:1 F4:1 G4:4 A4:1 B4:1 C5:2 B4:2 A4:2 G4:4" },
        { "line": "On a cold winter's night that was so deep.", "notes": "A4:1 B4:1 C5:2 B4:2 A4:2 G4:2 A4:2 B4:2 C5:2 G4:2 F4:2 E4:4" },
        { "line": "Noel, Noel, Noel, Noel,", "notes": "E4:1 D4:1 C4:3 D4:1 E4:1 F4:1 G4:4 C5:1 B4:1 A4:4 A4:2 G4:6" },
        { "line": "Born is the King of Israel.", "notes": "C5:2 B4:2 A4:2 G4:2 A4:2 B4:2 C5:2 G4:2 F4:2 E4:6" }
      ]
    },
    {
      "id": "o-come-all-ye-faithful",
      "title": "O Come, All Ye Faithful",
      "credit": "John Francis Wade, c. 1743",
      "tempo": 0.2,
      "file": "",
      "phrases": [
        { "line": "O come, all ye faithful,", "notes": "G4:2 G4:4 D4:2 G4:2 A4:4 D4:4" },
        { "line": "Joyful and triumphant,", "notes": "B4:2 A4:2 B4:2 C5:2 B4:4 A4:2 G4:2" },
        { "line": "O come ye, O come ye to Bethlehem.", "notes": "G4:4 F#4:2 E4:2 F#4:2 G4:2 A4:2 B4:2 F#4:4 E4:3 D4:1 D4:8" },
        { "line": "Come and behold Him, born the King of angels;", "notes": "D5:4 C5:2 B4:2 C5:4 B4:4 A4:2 B4:2 G4:2 A4:2 F#4:3 E4:1 D4:4" },
        { "line": "O come, let us adore Him,", "notes": "G4:2 G4:2 F#4:2 G4:2 A4:2 G4:4 D4:2" },
        { "line": "O come, let us adore Him,", "notes": "B4:2 B4:2 A4:2 B4:2 C5:2 B4:4 A4:2" },
        { "line": "O come, let us adore Him,", "notes": "B4:2 C5:2 B4:2 A4:2 G4:2 F#4:4 G4:2 C5:2 B4:4 A4:3 G4:1" },
        { "line": "Christ the Lord.", "notes": "G4:8 R:4" }
      ]
    }
  ]
};
