import DiscordBasePlugin from './discord-base-plugin.js';

export default class GCTLeader extends DiscordBasePlugin {
  static get description() {
    return 'The <code>DiscordServerStatus</code> plugin can be used to get the server status in Discord.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log round end events to.',
        default: '',
        example: '1292371911929630793'
      },
      updateInterval: {
        required: false,
        description: 'How frequently to update the time in Discord.',
        default: 60 * 1000
      },
      color: {
        required: false,
        description: 'The color of the embed.',
        default: 16761867
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

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
    // if (!this.options.setBotStatus) return;
    // let listPlayer = this.server.players
    // await this.sendDiscordMessage({
    //   embed: {
    //     title: 'Round Ended',
    //     description: "```"+this.server.players+"```",
    //     color: this.options.color,
    //     timestamp: info.time.toISOString()
    //   }
    // });
    console.log('\n\n')
    console.log(this.server.players)
    console.log('\n\n')
  }
}
