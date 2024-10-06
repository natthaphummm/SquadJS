import DiscordBasePlugin from './discord-base-plugin.js';

const cmdTimers = {};

export default class GCTSwitch extends DiscordBasePlugin {
  static get description() {
    return 'The <code>GCT Switch Team</code> plugin will log in-game chat to a Discord channel.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log admin broadcasts to.',
        default: '',
        example: '667741905228136459'
      },
      chatColors: {
        required: false,
        description: 'The color of the embed for each chat.',
        default: {},
        example: { main: 16761867 }
      },
      color: {
        required: false,
        description: 'The color of the embed.',
        default: 16761867
      },
      commands: {
        required: true,
        default: ['!switch'],
        description: 'A command for use ingame-chat.'
      },
      cooldownTime: {
        required: true,
        description: 'Cooldown time(ms)',
        default: 60000
      },
      cooldownMessage: {
        required: true,
        description: 'Message for alert cooldown time.',
        default: 'The command will be available again at'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onChatMessage = this.onChatMessage.bind(this);
  }

  async mount() {
    this.server.on('CHAT_MESSAGE', this.onChatMessage);
  }

  async unmount() {
    this.server.removeEventListener('CHAT_MESSAGE', this.onChatMessage);
  }

  async onChatMessage(info) {
    if (!this.options.commands.includes(info.message)) return;

    if (cmdTimers[info.player.steamID] && cmdTimers[info.player.steamID] >= Date.now()) {
      const date = new Date(cmdTimers[info.player.steamID]);
      this.server.rcon.warn(
        info.player.eosID,
        `${this.options.cooldownMessage} ${date.getHours()}:${date.getMinutes()}`
      );
      return;
    }

    cmdTimers[info.player.steamID] = Date.now() + this.options.cooldownTime;

    const { teamID } = info.player;
    await this.server.rcon.switchTeam(info.player.eosID);

    await this.sendDiscordMessage({
      embed: {
        title: 'Change Team',
        color: this.options.color,
        fields: [
          {
            name: 'Player',
            value: info.player.name,
            inline: true
          },
          {
            name: 'SteamID',
            value: `[${info.player.steamID}](https://steamcommunity.com/profiles/${info.steamID})`,
            inline: true
          },
          {
            name: 'EosID',
            value: info.player.eosID,
            inline: true
          },
          {
            name: 'Team Change',
            value: `From Team ${teamID} to Team ${teamID === '1' ? '2' : '1'}`
          }
        ],
        timestamp: info.time.toISOString()
      }
    });
  }
}
