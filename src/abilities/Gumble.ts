import * as $j from 'jquery';
import { Damage } from '../damage';
import { Team, isTeam } from '../utility/team';
import * as matrices from '../utility/matrices';
import * as arrayUtils from '../utility/arrayUtils';
import { Effect } from '../effect';
import { Creature } from '../creature';
import Game from '../game';
import { Hex } from '../utility/hex';
import { Trap } from '../utility/trap';

/** Creates the abilities
 * @param {Object} G the game object
 * @return {void}
 */
export default (G: Game) => {
	G.abilities[14] = [
		// First Ability: Gooey Body
		{
			// Update stat buffs whenever health changes
			trigger: 'onCreatureSummon onDamage onHeal',

			require: function () {
				// Always active
				return true;
			},

			activate: function () {
				if (this.creature.dead) {
					return;
				}
				// Attach a permanent effect that gives Gumble stat buffs
				// Bonus points to pierce, slash and crush based on remaining health
				const healthBonusDivisor = this.isUpgraded() ? 5 : 7;
				const bonus = Math.floor((this.creature.health / healthBonusDivisor) * 3);
				// Log whenever the bonus applied changes
				const noLog = bonus == this._lastBonus;
				this._lastBonus = bonus;
				const statsToApplyBonus = ['pierce', 'slash', 'crush'];
				const alterations = {};
				for (let i = 0; i < statsToApplyBonus.length; i++) {
					const key = statsToApplyBonus[i];
					alterations[key] = bonus;
				}
				this.creature.replaceEffect(
					new Effect(
						'Gooey Body', // name
						this.creature, // Caster
						this.creature, // Target
						'', // Trigger
						{
							alterations: alterations,
							deleteTrigger: '',
							stackable: false,
							effectFn: () => {
								if (bonus !== this._lastBonus) {
									G.log('Effect ' + this.title + ' triggered');
								}
							},
						},
						G,
					),
				);
				if (!noLog) {
					G.log(
						'%CreatureName' + this.creature.id + '% receives ' + bonus + ' pierce, slash and crush',
					);
				}
			},

			_lastBonus: 0,
		},

		// Second Ability: Gummy Mallet
		{
			// Type : Can be "onQuery", "onStartPhase", "onDamage"
			trigger: 'onQuery',

			require: function () {
				// Always usable, even if no targets
				return this.testRequirements();
			},

			// query() :
			query: function () {
				const ability = this;
				// Gummy Mallet can hit a 7-hexagon circular area in 6 directions, where the
				// center of each area is two hexes away. Each area can be chosen regardless
				// of whether targets are within.
				const area = [
					[1, 1],
					[1, 1, 1],
					[1, 1],
				] as matrices.AugmentedMatrix;

				const dx = this.creature.y % 2 !== 0 ? -1 : 0;
				const dy = -1;
				const choices = [
					G.grid.getHexMap(this.creature.x + 1 + dx, this.creature.y - 2 + dy, 0, false, area), // up-right
					G.grid.getHexMap(this.creature.x + 2 + dx, this.creature.y + dy, 0, false, area), // front
					G.grid.getHexMap(this.creature.x + 1 + dx, this.creature.y + 2 + dy, 0, false, area), // down-right
					G.grid.getHexMap(this.creature.x - 1 + dx, this.creature.y + 2 + dy, 0, false, area), // down-left
					G.grid.getHexMap(this.creature.x - 2 + dx, this.creature.y + dy, 0, false, area), // back
					G.grid.getHexMap(this.creature.x - 1 + dx, this.creature.y - 2 + dy, 0, false, area), // up-left
				];
				// Reorder choices based on number of hexes
				// This ensures that if a choice contains overlapping hexes only, that
				// choice won't be available for selection.
				choices.sort(function (choice1, choice2) {
					return choice1.length - choice2.length;
				});
				G.grid.queryChoice({
					fnOnCancel: function () {
						G.activeCreature.queryMove();
					},
					fnOnConfirm: function () {
						// eslint-disable-next-line
						ability.animation(...arguments);
					},
					team: Team.Both,
					id: this.creature.id,
					requireCreature: false,
					choices: choices,
				});
			},

			activate: function (hexes: Hex[]) {
				const ability = this;
				ability.end();

				G.Phaser.camera.shake(0.02, 333, true, G.Phaser.camera.SHAKE_VERTICAL, true);

				const targets = ability.getTargets(hexes);
				// Deal double damage to enemies if upgraded
				const enemyDamages = $j.extend({}, ability.damages);
				if (this.isUpgraded()) {
					for (const k in enemyDamages) {
						if ({}.hasOwnProperty.call(enemyDamages, k)) {
							enemyDamages[k] *= 2;
						}
					}
				}
				// See areaDamage()
				let kills = 0;
				for (let i = 0; i < targets.length; i++) {
					if (targets[i] === undefined) {
						continue;
					}
					let damages = this.damages;
					if (isTeam(this.creature, targets[i].target, Team.Enemy)) {
						damages = enemyDamages;
					}
					const dmg = new Damage(this.creature, damages, targets[i].hexesHit, [], G);
					// Increment kills if the target is killed
					kills += targets[i].target.takeDamage(dmg).kill ? 1 : 0;
				}
				if (kills > 1) {
					this.creature.player.score.push({
						type: 'combo',
						kills: kills,
					});
				}
			},
		},

		// Third Ability: Pretty Ribbon
		{
						// Type : Can be "onQuery", "onStartPhase", "onDamage"

	
			trigger: 'onQuery', 

			_targetTeam: Team.Both,

			// require() :
			require: function () {
				return this.testRequirements();
			},

			// query() :
			query: function () {
				const ability = this;
				const creature = this.creature;

				
				const area = [
					[1, 1],
					[1, 1],
				] as matrices.AugmentedMatrix;

				const dx = this.creature.y % 2 !== 0 ? -1 : 0;
				const dy = -1;
				const choices = [
					G.grid.getHexMap(this.creature.x + 1 + dx, this.creature.y - 1 + dy, 0, false, [
						[1],
						[1, 1],
					] as matrices.AugmentedMatrix), // up-right
					G.grid.getHexMap(this.creature.x + 1 + dx, this.creature.y + 1 + dy, 0, false, [
						[1, 1],
					] as matrices.AugmentedMatrix), // front
					G.grid.getHexMap(this.creature.x + 1 + dx, this.creature.y + 2 + dy, 0, false, area), // down-right
					G.grid.getHexMap(this.creature.x - 1 + dx, this.creature.y + 2 + dy, 0, false, [
						[1, 1],
						[0, 1],
					] as matrices.AugmentedMatrix), // down-left
					G.grid.getHexMap(this.creature.x - 2 + dx, this.creature.y + 1 + dy, 0, false, [
						[1, 1],
					] as matrices.AugmentedMatrix), // back
					G.grid.getHexMap(this.creature.x - 1 + dx, this.creature.y - 1 + dy, 0, false, area), // up-left
					G.grid.getHexMap(this.creature.x, this.creature.y, 0, false, [
						[1],
					] as matrices.AugmentedMatrix),
				];
				// Reorder choices based on number of hexes
				// This ensures that if a choice contains overlapping hexes only, that
				// choice won't be available for selection.
				choices.sort(function (choice1, choice2) {
					return choice1.length - choice2.length;
				});
				G.grid.queryChoice({
					fnOnCancel: function () {
						G.activeCreature.queryMove();
					},
					fnOnConfirm: function () {
						// eslint-disable-next-line
						ability.animation(...arguments);
					},
					team: Team.Both,
					id: this.creature.id,
					requireCreature: false,
					choices: choices,
				});
			},

			// activate() :
			activate: function (hex: Hex[]) {
				const ability = this;
				const swine = this.creature;
				
				ability.end();

				const targets = ability.getTargets(hex);

				const isSelf = hex[0].x == swine.x && hex[0].y == swine.y;

				if (isSelf) {
					this.creature.heal(20, true);
					this.creature.restoreEndurance(2);
					
					this.creature.restoreRegrowth(2);
				}

				targets.forEach(function (item) {
					if (!(item.target instanceof Creature)) return;

					const trg = item.target;
				

					G.Phaser.camera.shake(0.01, 100, true, G.Phaser.camera.SHAKE_VERTICAL, true);

					// If the target is an ally, heal it and restore endurance and regrowth
					
					if (isTeam(ability.creature, trg, Team.Ally)) {
						trg.heal(20, true, true);
						trg.restoreEndurance(2, true);
						trg.restoreRegrowth(2, true);
					} else if (isTeam(ability.creature, trg, Team.Enemy) && ability.isUpgraded()) { // If the target is an enemy and the ability is upgraded
						if ((trg.name =='Dark Priest') &&  trg.hasCreaturePlayerGotPlasma())
						{
							
							//if the creature is not a Dark Priest or the player has got no Plasma
							const damage=  new Damage(ability.creature, // Attacker
								{}, // Damage Type
								1, // Area
								[], // Effects
								G,
								0, // Damage Amount
							);
							trg.takeDamage(damage);

						}
						else
						{
							const debuffEffect = new Effect(
								'Ribbon Debuff',
								ability.creature,
								trg,
								'',
								{
									alterations: {
										movement: -2,
									},
									turnLifetime: 1,
									deleteTrigger: 'onStartOfRound',
								},
								G,
							);

							trg.addEffect(
								debuffEffect,
								`%CreatureName${trg.id}% is weakened by Pretty Ribbon`,
								'',
								false,
								true,
							);
						}
						}
					});

					
				}

		},

		// Fourth Ability: Boom Box
		{
			// Type : Can be "onQuery", "onStartPhase", "onDamage"
			trigger: 'onQuery',

			directions: [1, 1, 1, 1, 1, 1],
			_targetTeam: Team.Enemy,

			// require() :
			require: function () {
				if (!this.testRequirements()) {
					return false;
				}

				if (
					!this.testDirection({
						team: this._targetTeam,
						directions: this.directions,
					})
				) {
					return false;
				}
				return true;
			},

			// query() :
			query: function () {
				const ability = this;
				const crea = this.creature;

				G.grid.queryDirection({
					fnOnConfirm: function () {
						// eslint-disable-next-line
						ability.animation(...arguments);
					},
					flipped: crea.player.flipped,
					team: this._targetTeam,
					id: this.creature.id,
					requireCreature: true,
					x: crea.x,
					y: crea.y,
					directions: this.directions,
				});
			},

			// activate() :
			activate: function (path, args) {
				const ability = this;
				ability.end();
				G.Phaser.camera.shake(0.02, 300, true, G.Phaser.camera.SHAKE_HORIZONTAL, true);

				let target = arrayUtils.last(path).creature;
				{
					// TODO:
					// target is undefined when Player 2 creature uses this ability.
					// arrayUtils.last(path).creature is undefined.
					// This block fixes the error, but it's an ugly fix.
					if (!target) {
						const attackingCreature = ability.creature;
						const creatures = path
							.map((hex) => hex.creature)
							.filter((c) => c && c != attackingCreature);
						if (creatures.length === 0) {
							return;
						} else {
							target = creatures[0];
						}
					}
				}
				const melee = path[0].creature === target;

				const d = melee
					? {
							sonic: 20,
							crush: 10,
					  }
					: {
							sonic: 20,
					  };

				let dir = [];
				switch (args.direction) {
					case 0: // Upright
						dir = G.grid
							.getHexMap(target.x, target.y - 8, 0, target.flipped, matrices.diagonalup)
							.reverse();
						break;
					case 1: // StraitForward
						dir = G.grid.getHexMap(target.x, target.y, 0, target.flipped, matrices.straitrow);
						break;
					case 2: // Downright
						dir = G.grid.getHexMap(target.x, target.y, 0, target.flipped, matrices.diagonaldown);
						break;
					case 3: // Downleft
						dir = G.grid.getHexMap(target.x, target.y, -4, target.flipped, matrices.diagonalup);
						break;
					case 4: // StraitBackward
						dir = G.grid.getHexMap(target.x, target.y, 0, !target.flipped, matrices.straitrow);
						break;
					case 5: // Upleft
						dir = G.grid
							.getHexMap(target.x, target.y - 8, -4, target.flipped, matrices.diagonaldown)
							.reverse();
						break;
					default:
						break;
				}

				const canKnockBack =
					dir.length > 1 &&
					dir[1].isWalkable(target.size, target.id, true) &&
					target.stats.moveable;

				// Perform extra damage if upgraded and cannot push back
				if (this.isUpgraded() && !canKnockBack) {
					d.sonic += 10;
				}

				const damage = new Damage(
					ability.creature, // Attacker
					d, // Damage Type
					1, // Area
					[], // Effects
					G,
				);

				const result = target.takeDamage(damage, {
					ignoreRetaliation: true,
				});

				if (result.kill) {
					return;
				} // if creature die stop here

				// Knockback the target 1 hex
				if (canKnockBack) {
					target.moveTo(dir[1], {
						ignoreMovementPoint: true,
						ignorePath: true,
						callback: function () {
							G.activeCreature.queryMove();
						},
						animation: 'push',
					});
				}
			},
		},
	];
};
