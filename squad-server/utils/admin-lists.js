import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import axios from 'axios';
import Logger from '../../core/logger';

const __dirname = fileURLToPath(import.meta.url);

export default async function fetchAdminLists(adminLists) {
  Logger.verbose('SquadServer', 1, `Fetching Admin Lists...`);

  const groups = {};
  const admins = {};

  for (const [idx, list] of adminLists.entries()) {
    let data = '';
    try {
      switch (list.type) {
        case 'remote': {
          const resp = await axios({
            method: 'GET',
            url: `${list.source}`
          });
          data = resp.data;
          break;
        }
        case 'local': {
          const listPath = path.resolve(__dirname, '../../../', list.source);
          if (!fs.existsSync(listPath)) throw new Error(`Could not find Admin List at ${listPath}`);
          data = fs.readFileSync(listPath, 'utf8');
          break;
        }
        default:
          throw new Error(`Unsupported AdminList type:${list.type}`);
      }
    } catch (error) {
      Logger.verbose(
        'SquadServer',
        1,
        `Error fetching ${list.type} admin list: ${list.source}`,
        error
      );
    }

    const groupRgx = /(?<=^Group=)(?<groupID>.*?):(?<groupPerms>.*?)(?=(?:\r\n|\r|\n|\s+\/\/))/gm;
    const adminRgx = /(?<=^Admin=)(?<adminID>\d{17}|[a-f0-9]{32}):(?<groupID>\S+)/gm;

    for (const m of data.matchAll(groupRgx)) {
      groups[`${idx}-${m.groups.groupID}`] = m.groups.groupPerms.split(',');
    }
    for (const m of data.matchAll(adminRgx)) {
      try {
        const group = groups[`${idx}-${m.groups.groupID}`];
        const perms = {};
        for (const groupPerm of group) perms[groupPerm.toLowerCase()] = true;

        const adminID = m.groups.adminID;
        if (adminID in admins) {
          admins[adminID] = Object.assign(admins[adminID], perms);
          Logger.verbose(
            'SquadServer',
            3,
            `Merged duplicate Admin ${adminID} to ${Object.keys(admins[adminID])}`
          );
        } else {
          admins[adminID] = Object.assign(perms);
          Logger.verbose(
            'SquadServer',
            3,
            `Added Admin ${adminID} with ${Object.keys(admins[adminID])}`
          );
        }
      } catch (error) {
        Logger.verbose(
          'SquadServer',
          1,
          `Error parsing admin group ${m.groups.groupID} from admin list: ${list.source}`,
          error
        );
      }
    }
  }
  Logger.verbose('SquadServer', 1, `${Object.keys(admins).length} admins loaded...`);
  return admins;
}
