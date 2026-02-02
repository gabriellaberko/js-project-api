import Thought from "./models/Thought"

export const seedDatabase = async () => {
  await Thought.deleteMany() // To not have duplicates every time this function runs

  /* --- Using the models created to add data --- */

  await new Thought({ message: "Berlin baby", hearts: [{ userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }], createdAt: "2025-05-19T22:07:08.999Z" }).save();
  await new Thought({ message: "My family!", createdAt: "2025-05-22T22:29:32.232Z" }).save();
  await new Thought({ message: "The smell of coffee in the morning....", hearts: [{ userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null } ], createdAt: "2025-05-22T22:11:16.075Z" }).save();
  await new Thought({ message: "Newly washed bedlinen, kids that sleeps through the night.. FINGERS CROSSED 🤞🏼\n", hearts: [{ userId: null }, { userId: null }, { userId: null }, { userId: null }], createdAt: "2025-05-21T21:42:23.862Z" }).save();
  await new Thought({ message: "I am happy that I feel healthy and have energy again", hearts: [{ userId: null }, { userId: null }, { userId: null }, { userId: null }], createdAt: "2025-05-21T21:28:32.196Z" }).save();
  await new Thought({ message: "Cold beer", hearts: [{ userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }], createdAt: "2025-05-21T19:05:34.113Z" }).save();
  await new Thought({ message: "My friend is visiting this weekend! <3", hearts: [{ userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }], createdAt: "2025-05-21T18:59:58.121Z" }).save();
  await new Thought({ message: "A good joke: \nWhy did the scarecrow win an award?\nBecause he was outstanding in his field!", hearts: [{ userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }, { userId: null }], createdAt: "2025-05-20T20:54:51.082Z" }).save();
  await new Thought({ message: "Tacos and tequila🌮🍹", hearts: [{ userId: null }, { userId: null }], createdAt: "2025-05-19T20:53:18.899Z" }).save();
  await new Thought({ message: "Netflix and late night ice-cream🍦", hearts: [{ userId: null }], createdAt: "2025-05-18T20:51:34.494Z" }).save();
  await new Thought({ message: "The weather is nice!", hearts: [{ userId: null }, { userId: null }], createdAt: "2025-05-20T15:03:22.379Z" }).save();
  await new Thought({ message: "Summer is coming...", createdAt: "2025-05-20T11:58:29.662Z" }).save();
  await new Thought({ message: "good vibes and good things", hearts: [{ userId: null }, { userId: null }, { userId: null }], createdAt: "2025-05-20T03:57:40.322Z" }).save();
};