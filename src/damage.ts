import Game from './game';
import { Creature, CreatureVitals, CreatureMasteries } from './creature';
import { Effect } from './effect';

export type DamageStats = Partial<CreatureVitals & CreatureMasteries & { pure?: number }>;
export type DamageResult = Partial<DamageStats> & { total: number };

export class Damage {
	// TODO: `game` isn't used by this class. Once migration to TS is complete,
	// remove `game`. (TS will flag instances where caller code tries to access `game`.)
	game: Game;
	attacker: Creature;
	damages: DamageStats;
	status = '';
	effects: Effect[];
	area: number; // Number of unit hexagons (1, 2 or 3) that are being hit
	counter = false; // Is this counter-damage?
	dmgAmount: number;

	target: Creature | undefined = undefined;
	melee: boolean | undefined = undefined;
	isFromTrap: boolean | undefined = undefined;

	noLog = false;

	/** Constructor
	 * @param {Creature} attacker Unit that initiated the damage
	 * @param {DamageStats} damages Object containing the damage by type {frost : 5} for example
	 * @param {number} area Number of hexagons being hit
	 * @param {Effect[]} effects Contains Effect object to apply to the target
	 * @param {Game} game Game object
	 * @param {DamageAmount} dmgAmount Specifies the damage amount which is dealt to the target
	 */
	constructor(
		attacker: Creature,
		damages: DamageStats,
		area: number,
		effects: Effect[],
		game: Game,
		dmgAmount: number = 1,
	) {
		this.game = game;
		this.attacker = attacker;
		this.damages = damages;
		this.effects = effects;
		this.area = area;
		this.dmgAmount = dmgAmount;
	}

	applyDamage() {
		if (!this.target) return;

		const trg = this.target.stats;
		const atk = this.attacker.stats;
		const result: DamageResult = { total: 0 };

		if (this.dmgAmount === 0) return result;

		Object.entries(this.damages).forEach(([key, value]) => {
			if (key == 'pure') {
				// NOTE: 'Pure' damage bypasses defenses, resistances, etc.
				result[key] = value;
			} else {
				result[key] = Math.round(
					value * (1 + (atk.offense - trg.defense / this.area + (atk[key] - trg[key])) / 100),
				);
			}

			result.total += result[key];
		});

		// NOTE: Always do a minimum of 1 total damage
		result.total = Math.max(result.total, 1);

		return result;
	}
}
