import quiz from "pop-quiz";
import eventualequal from "../assertions/eventualequal.mjs";
import { asyncFrom } from "../index.mjs";

await quiz("Test assertions", async function* () {
  const a = asyncFrom(1, 2, 3);
  const b = asyncFrom(1, 2, 3);
  yield await eventualequal(
    a,
    b,
    "eventualequal should pass if given arguments are eventually equal"
  );
});
