import { useMemo, useState } from 'react';
import { AUTOPLAY_CASH_COST, CLAUDE_LEVEL_LABELS, MAX_CLAUDE_LEVEL, claudeLevelUpCost } from './claude';
import {
  cashPrizeForLevel,
  competitionLevelUpCost,
  COMPETITION_LEVEL_LABELS,
  COMPETITION_UNLOCK_GAMES,
  MAX_COMPETITION_LEVEL,
} from './competition';
import { CASH_EXCHANGE_COST, CASH_EXCHANGE_TOKENS } from './exchange';
import { FRAGMENTS } from './fragments';
import { getSeedFromLocation } from './prng';
import { PRESTIGE_UPGRADES } from './prestigeShop';
import { useGame } from './useGame';

function App() {
  const seed = useMemo(() => getSeedFromLocation(window.location.search), []);
  const {
    cells,
    size,
    status,
    loopCount,
    totalGamesPlayed,
    winCount,
    lossCount,
    echoes,
    upgrades,
    fragments,
    offlineSummary,
    metaCurrency,
    tokens,
    claudeLevel,
    competitionLevel,
    cash,
    prestigeUpgrades,
    playCell,
    purchaseAutoplay,
    prestige,
    purchaseClaudeLevel,
    purchaseCompetitionLevel,
    purchasePrestigeUpgrade,
    exchangeCashForTokens,
  } = useGame(seed);
  const [confirmingPrestige, setConfirmingPrestige] = useState(false);
  const claudeOwned = Boolean(upgrades.autoplay);
  const nextClaudeLevelCost = claudeLevelUpCost(claudeLevel);
  const nextCompetitionLevelCost = competitionLevelUpCost(competitionLevel);
  const competitionUnlocked = totalGamesPlayed >= COMPETITION_UNLOCK_GAMES;

  return (
    <main>
      <h1>The Nine Squares</h1>
      {offlineSummary && <p data-testid="offline-summary">{offlineSummary}</p>}
      <p data-testid="loop-count-label">
        Loop <span data-testid="loop-count">{loopCount}</span>
      </p>
      <p data-testid="win-count-label">
        Wins <span data-testid="win-count">{winCount}</span>
      </p>
      <p data-testid="loss-count-label">
        Losses <span data-testid="loss-count">{lossCount}</span>
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
      <p data-testid="cash-count-label">
        Cash <span data-testid="cash-count">{cash}</span>
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
        <button
          data-testid="upgrade-autoplay"
          data-state={claudeOwned ? 'owned' : 'available'}
          disabled={claudeOwned || cash < AUTOPLAY_CASH_COST}
          onClick={() => purchaseAutoplay()}
        >
          Unlock Claude ({AUTOPLAY_CASH_COST} cash)
        </button>
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
      {!competitionUnlocked && (
        <p data-testid="competition-locked">
          Play {COMPETITION_UNLOCK_GAMES - totalGamesPlayed} more{' '}
          {COMPETITION_UNLOCK_GAMES - totalGamesPlayed === 1 ? 'game' : 'games'} to unlock competition.
        </p>
      )}
      {competitionUnlocked && (
        <div data-testid="competition-panel">
          <p data-testid="competition-level-label">
            {COMPETITION_LEVEL_LABELS[competitionLevel]} (level{' '}
            <span data-testid="competition-level">{competitionLevel}</span>)
            {competitionLevel > 0 && ` — wins pay ${cashPrizeForLevel(competitionLevel)} cash`}
          </p>
          {competitionLevel < MAX_COMPETITION_LEVEL ? (
            <button
              data-testid="competition-level-up"
              disabled={nextCompetitionLevelCost === null || echoes < nextCompetitionLevelCost}
              onClick={() => purchaseCompetitionLevel()}
            >
              Enter {COMPETITION_LEVEL_LABELS[competitionLevel + 1]} ({nextCompetitionLevelCost} echoes)
            </button>
          ) : (
            <p data-testid="competition-level-maxed">You have reached the top tier of competition.</p>
          )}
          <button
            data-testid="exchange-cash-for-tokens"
            disabled={cash < CASH_EXCHANGE_COST}
            onClick={() => exchangeCashForTokens()}
          >
            Exchange {CASH_EXCHANGE_COST} cash → {CASH_EXCHANGE_TOKENS} tokens
          </button>
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
      <div data-testid="prestige-shop">
        {PRESTIGE_UPGRADES.map((u) => {
          const owned = Boolean(prestigeUpgrades[u.id]);
          return (
            <button
              key={u.id}
              data-testid={`prestige-upgrade-${u.id}`}
              data-state={owned ? 'owned' : 'available'}
              disabled={owned || metaCurrency < u.cost}
              onClick={() => purchasePrestigeUpgrade(u.id)}
            >
              {u.label} ({u.cost} sparks)
            </button>
          );
        })}
      </div>
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
