import { useMemo } from 'react';
import { getSeedFromLocation } from './prng';

const BOARD_SIZE = 3;

function App() {
  // The seed threads from the URL through to the opponent's PRNG (src/prng.ts),
  // wired up starting with the core loop deliverable.
  const seed = useMemo(() => getSeedFromLocation(window.location.search), []);

  const cells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => i);

  return (
    <main>
      <h1>The Nine Squares</h1>
      <p data-testid="loop-count-label">
        Loop <span data-testid="loop-count">0</span>
      </p>
      <div data-testid="board" data-state="playing" data-seed={seed}>
        {cells.map((i) => (
          <button key={i} data-testid="cell" data-index={i} aria-label={`cell ${i}`} />
        ))}
      </div>
    </main>
  );
}

export default App;
