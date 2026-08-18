import { useMemo } from 'react';
import { getSeedFromLocation } from './prng';
import { UPGRADES } from './upgrades';
import { useGame } from './useGame';

function App() {
  const seed = useMemo(() => getSeedFromLocation(window.location.search), []);
  const { cells, size, status, loopCount, echoes, upgrades, playCell, purchaseUpgrade } = useGame(seed);

  return (
    <main>
      <h1>The Nine Squares</h1>
      <p data-testid="loop-count-label">
        Loop <span data-testid="loop-count">{loopCount}</span>
      </p>
      <p data-testid="echo-count-label">
        Echoes <span data-testid="echo-count">{echoes}</span>
      </p>
      <p data-testid="status">{status}</p>
      <div
        data-testid="board"
        data-state="playing"
        data-seed={seed}
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {cells.map((mark, i) => (
          <button
            key={i}
            data-testid="cell"
            data-index={i}
            data-mark={mark ?? undefined}
            aria-label={`cell ${i}`}
            disabled={mark !== null}
            onClick={() => playCell(i)}
          >
            {mark ?? ''}
          </button>
        ))}
      </div>
      <div data-testid="upgrades">
        {UPGRADES.map((u) => {
          const owned = Boolean(upgrades[u.id]);
          return (
            <button
              key={u.id}
              data-testid={`upgrade-${u.id}`}
              data-state={owned ? 'owned' : 'available'}
              disabled={owned || echoes < u.cost}
              onClick={() => purchaseUpgrade(u.id)}
            >
              {u.label} ({u.cost})
            </button>
          );
        })}
      </div>
    </main>
  );
}

export default App;
