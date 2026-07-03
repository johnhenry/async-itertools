import quiz, { equal, deepequal } from "pop-quiz";
import { teeSync, teeAsync, asyncFrom } from "../index.mjs";
import eventualequal from "../assertions/eventualequal.mjs";
// https://stackoverflow.com/questions/46416266/how-to-clone-an-iterator-in-javascript
// https://github.com/tc39/proposal-iterator-helpers

await quiz(
  "teeSync should produce results that mirror original ",
  function* () {
    const original = [1, 2, 3, 4, 5];
    const teed = teeSync(2)(original);
    yield equal(teed.length, 2, "teeSync(2) should produce 2 results");
    const [it0, it1] = teed;
    yield deepequal([...it0], original, "1st result should mirror original");
    yield deepequal([...it1], original, "2nd result should mirror original");
  }
);

await quiz(
  "teeAsync should produce results that mirror original ",
  async function* () {
    const original = [1, 2, 3, 4, 5];
    const it = asyncFrom(...original);
    const teed = teeAsync(2)(it);
    yield equal(teed.length, 2, "teeASync(2) should produce 2 results");
    const [it0, it1] = teed;

    yield await eventualequal(
      it0,
      original,
      "1st result should mirror original"
    );
    yield await eventualequal(
      it1,
      original,
      "2nd result should mirror original"
    );
    yield await eventualequal(it, [], "oirginal iterator should be exhausted");
  }
);

// Regression: both next() functions distributed each pulled value to
// buffers[1 - i] only. That's correct for exactly 2 outputs (0 and 1 swap),
// but for 3+ outputs any index besides 0/1 never got fed at all -- verified
// empirically, teeSync(3)(...)'s 3rd output silently produced [].
await quiz(
  "teeSync/teeAsync should support more than 2 outputs",
  async function* () {
    const original = [1, 2, 3, 4, 5];

    const [sa, sb, sc] = teeSync(3)(original);
    yield deepequal([...sa], original, "teeSync 3-way: 1st output");
    yield deepequal([...sb], original, "teeSync 3-way: 2nd output");
    yield deepequal([...sc], original, "teeSync 3-way: 3rd output");

    const [aa, ab, ac] = teeAsync(3)(asyncFrom(...original));
    yield await eventualequal(aa, original, "teeAsync 3-way: 1st output");
    yield await eventualequal(ab, original, "teeAsync 3-way: 2nd output");
    yield await eventualequal(ac, original, "teeAsync 3-way: 3rd output");
  }
);
