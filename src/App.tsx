import { useMemo, useState } from 'react';
import { CLAUDE_LEVEL_LABELS, MAX_CLAUDE_LEVEL, claudeLevelUpCost } from './claude';
import { FRAGMENTS } from './fragments';
import { getSeedFromLocation } from './prng';
import { UPGRADES } from './upgrades';
import { useGame } from './useGame';

function App() {
  const seed = useMemo(() => getSeedFromLocation(window.location.search), []);
  const {
    cells,
    size,
    status,
    loopCount,
    echoes,
    upgrades,
    fragments,
    offlineSummary,
    metaCurrency,
    tokens,
    claudeLevel,
    playCell,
    purchaseUpgrade,
    prestige,
    purchaseClaudeLevel,
  } = useGame(seed);
  const [confirmingPrestige, setConfirmingPrestige] = useState(false);
  const claudeOwned = Boolean(upgrades.autoplay);
  const nextClaudeLevelCost = claudeLevelUpCost(claudeLevel);

  return (
    <main>
      <h1>The Nine Squares</h1>
      {offlineSummary && <p data-testid="offline-summary">{offlineSummary}</p>}
      <p data-testid="loop-count-label">
        Loop <span data-testid="loop-count">{loopCount}</span>
      </p>
      <p data-testid="echo-count-label">
        Echoes <span data-testid="echo-count">{echoes}</span>
      </p>
      <p data-testid="meta-currency-label">
        Sparks <span data-testid="meta-currency">{metaCurrency}</span>
      </p>
      <p data-testid="token-count-label">
        Tokens <span data-testid="token-count">{tokens}</span>
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
      {claudeOwned && (
        <div data-testid="claude-panel">
          <p data-testid="claude-level-label">
            {CLAUDE_LEVEL_LABELS[claudeLevel]} (level <span data-testid="claude-level">{claudeLevel}</span>)
          </p>
          {claudeLevel < MAX_CLAUDE_LEVEL ? (
            <button
              data-testid="claude-level-up"
              disabled={nextClaudeLevelCost === null || tokens < nextClaudeLevelCost}
              onClick={() => purchaseClaudeLevel()}
            >
              Upgrade {CLAUDE_LEVEL_LABELS[claudeLevel + 1]} ({nextClaudeLevelCost} tokens)
            </button>
          ) : (
            <p data-testid="claude-level-maxed">Claude has learned all it can.</p>
          )}
        </div>
      )}
      <ul data-testid="fragment-log">
        {fragments.map((id) => {
          const fragment = FRAGMENTS.find((f) => f.id === id);
          return (
            <li key={id} data-testid="fragment">
              {fragment?.text}
            </li>
          );
        })}
      </ul>
      <div data-testid="prestige">
        {!confirmingPrestige && (
          <button data-testid="prestige-button" onClick={() => setConfirmingPrestige(true)}>
            Concede the loop
          </button>
        )}
        {confirmingPrestige && (
          <>
            <p>Concede this run — echoes, upgrades, and the board reset — for a permanent yield multiplier?</p>
            <button
              data-testid="prestige-confirm"
              onClick={() => {
                prestige();
                setConfirmingPrestige(false);
              }}
            >
              Concede
            </button>
            <button data-testid="prestige-cancel" onClick={() => setConfirmingPrestige(false)}>
              Stay in the loop
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default App;
