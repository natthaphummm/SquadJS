import BasePlugin from './base-plugin.js';

export default class GCTLeader extends BasePlugin {
  static get description() {
    return 'The <code>DiscordServerStatus</code> plugin can be used to get the server status in Discord.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      updateInterval: {
        required: false,
        description: 'How frequently to update the time in Discord.',
        default: 60 * 1000
      },
      warnMessage: {
        required: false,
        description: 'Message for alert.',
        default: 'If not changed to Role Leader, this Squad will be disbanded within 5 minutes.'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);
    this.warningList = [];
    this.updateStatus = this.updateStatus.bind(this);
  }

  async mount() {
    await super.mount();
    this.updateStatusInterval = setInterval(this.updateStatus, this.options.updateInterval);
  }

  async unmount() {
    await super.unmount();
    clearInterval(this.updateStatusInterval);
  }

  async updateStatus() {
    if (!this.server.players.length) return;

    const players = this.server.players;
    const leaders = players.filter((player) => player.isLeader && player.squadID !== null);

    leaders.forEach((player) => {
      const warning = this.warningList.find((warning) => warning.eosID === player.eosID);
      if (warning && player.isLeader && !player.role.includes('_SL')) {
        this.server.rcon.execute(`AdminDisbandSquad ${player.teamID} ${player.squadID}`);
      }
    });

    // Reset Warning List
    this.warningList = [];

    // New Warning List
    setTimeout(() => {
      this.warningList = this.server.players.filter(
        (player) => player.isLeader && !player.role.includes('_SL') && player.squadID !== null
      );
      this.warningList.forEach(async (player) => {
        await this.server.rcon.warn(player.eosID, this.options.warnMessage);
      });
    }, 1000);
  }
}
