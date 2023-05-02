/**
 * Copyright 2017 Joe Gaska
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

// --------------------------------------------------------------------------------------------------------------
/*

TODO
    Add Get
    Add Delete

 http://ourcodeworld.com/articles/read/133/how-to-create-a-sftp-client-with-node-js-ssh2-in-electron-framework

*/
// --------------------------------------------------------------------------------------------------------------

// STILL VALIDATING CONNECTIVITY
//  -- DID validate it works with list/dir
const fs = require('fs');

module.exports = function (RED) {
  'use strict';

  const sftp = require('ssh2').Client;
  const fs = require('fs');

  function SFtpNode(n) {
    RED.nodes.createNode(this, n);
    // var node = this;

    console.log('SFTP - Config - username: ' + n.username);
    console.log('SFTP - Config - hmac: ' + n.hmac);
    console.log('SFTP - Config - cipher: ' + n.cipher);

    // console.log('SFTP - Config - ssh-key: ' + n.sshkey);

    let keyFile = null;
    let keyData = null;

    if (n.sshkey) {
      keyFile = 'keyFile';
      keyData = n.sshkey;
      console.log('************************');
      console.log(keyData);
      console.log('************************');
    }
    if (process.env.SFTP_SSH_KEY_FILE) {
      keyFile = process.env.SFTP_SSH_KEY_FILE;
      keyFile = require('path').resolve(__dirname, '../../' + keyFile);
      console.log('SFTP_SSH_KEY_FILE: ' + keyFile);

      try {
        keyData = fs.readFileSync(keyFile).toString();
        // console.log("[http://wwww.HardingPoint.com PRIVATE KEY] " + keyData);
      } catch (e) {
        keyData = null;
        console.log('SFTP - Read Key File [' + keyFile + '] Exception : ' + e);
      }
    }

    if (keyFile && keyData) {
      console.log('SFTP - Using privateKey: ' + keyFile + ' Length: ' + keyData.toString().length);
      this.options = {
        host: n.host || 'localhost',
        port: n.port || 21,
        username: n.username,
        password: n.password,
        privateKey: keyData,
        algorithms: {
          // hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1', 'hmac-sha1-96'],
          // cipher: ['aes256-cbc']
          hmac: n.hmac,
          cipher: n.cipher,
        },
      };
    } else {
      console.log('SFTP - Using User/Pwd');
      this.options = {
        host: n.host || 'localhost',
        port: n.port || 21,
        username: n.username,
        password: n.password,
        algorithms: {
          // hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1', 'hmac-sha1-96'],
          // cipher: ['aes256-cbc']
          hmac: n.hmac,
          cipher: n.cipher,
        },
      };
    }
  }

  RED.nodes.registerType('sftp', SFtpNode);

  function SFtpInNode(n) {
    RED.nodes.createNode(this, n);
    this.sftp = n.sftp;
    this.operation = n.operation;
    this.filename = n.filename;
    this.fileExtension = n.fileExtension;
    this.workdir = n.workdir;
    this.sftpConfig = RED.nodes.getNode(this.sftp);

    if (this.sftpConfig) {
      const node = this;
      node.on('input', function (msg, send, done) {
        try {
          node.workdir = node.workdir || msg.workdir || './';
          node.fileExtension = node.fileExtension || msg.fileExtension || '';

          /*SFTP options*/
          node.sftpConfig.options.host = msg.host || node.sftpConfig.options.host;
          node.sftpConfig.options.port = msg.port || node.sftpConfig.options.port;
          node.sftpConfig.options.username = msg.user || node.sftpConfig.options.username || '';
          node.sftpConfig.options.password = msg.password || node.sftpConfig.options.password || '';

          console.log('========');
          console.log(node.sftpConfig.options.privateKey);
          console.log('========');

          let conn = new sftp();

          this.sendMsg = function (err, result) {
            if (err) {
              // node.error(err.toString(), msg);
              node.status({ fill: 'red', shape: 'ring', text: 'failed' });
              done(err);
              return;
            }
            node.status({});
            conn.end();
            msg.payload = result;
            node.send(msg);
          };

          conn.on('ready', function () {
            switch (node.operation) {
              case 'list':
                conn.sftp(function (err, sftp) {
                  if (err) {
                    // node.error(err, msg);
                    done(err);
                    return;
                  }
                  sftp.readdir(node.workdir, node.sendMsg);
                });
                break;
              case 'get':
                conn.sftp(function (err, sftp) {
                  if (err) {
                    // node.error(err, msg);
                    done(err);
                    return;
                  }
                  let ftpfilename = node.workdir + node.filename;

                  if (msg.payload.filename) ftpfilename = msg.payload.filename;

                  let bufferarray = [];

                  // Be very careful bufferSize too large causes issues with multi threading
                  let stream = sftp.createReadStream(ftpfilename, { highWaterMark: 1024, bufferSize: 1024 });

                  let counter = 0;
                  let buf = '';
                  let byteSize = 65536;

                  stream
                    .on('data', function (d) {
                      buf += d;
                      counter++;
                      // console.log("Read Chunk ("+ counter + "): " + d.length + " Length: " + buf.length);
                    })
                    .on('end', function () {
                      node.status({});
                      conn.end();
                      console.log('SFTP Read Chunks ' + counter + ' Length: ' + buf.length);
                      msg.payload = {};
                      msg.payload.filedata = buf;
                      msg.payload.filename = ftpfilename;
                      node.send(msg);
                    });
                });
                break;
              case 'put':
                conn.sftp(function (err, sftp) {
                  if (err) {
                    // node.error(err, msg);
                    done(err);
                    return;
                  }
                  let newFile = '';
                  if (msg.payload.filename) {
                    newFile = msg.payload.filename;
                  } else if (node.filename == '') {
                    let d = new Date();
                    let guid = d.getTime().toString();
                    if (node.fileExtension == '') node.fileExtension = '.txt';
                    newFile = node.workdir + guid + node.fileExtension;
                  } else {
                    newFile = node.workdir + node.filename;
                  }

                  let msgData = '';
                  if (msg.payload.filedata) msgData = msg.payload.filedata;
                  else msgData = JSON.stringify(msg.payload);

                  console.log('SFTP Put:' + newFile);
                  let writeStream = sftp.createWriteStream(newFile, { flags: 'w' });
                  // var payloadBuff = new Buffer(msgData);
                  // writeStream.write(payloadBuff, node.sendMsg);
                  writeStream.write(msgData, function (err, result) {
                    node.status({});
                    conn.end();
                    msg.payload = {};
                    msg.payload.filename = newFile;
                    node.send(msg);
                  });
                });
                break;
              case 'delete':
                conn.sftp(function (err, sftp) {
                  if (err) {
                    // node.error(err, msg);
                    done(err);
                    return;
                  }
                  let ftpfilename = node.workdir + node.filename;
                  if (msg.payload.filename) ftpfilename = msg.payload.filename;
                  console.log('SFTP Deleting File: ' + ftpfilename);
                  sftp.unlink(ftpfilename, function (err) {
                    if (err) {
                      // node.error(err, msg);
                      done(err);
                      return;
                    } else {
                      console.log('SFTP file unlinked');
                      node.status({});
                      msg.payload = {};
                      msg.payload.filename = ftpfilename;
                      node.send(msg);
                    }
                    conn.end();
                  });
                });
                break;
            }
          });
          conn.on('error', function (error) {
            // node.error(error, msg);
            done(error);
            return;
          });
          conn.connect(node.sftpConfig.options);
        } catch (error) {
          // node.error(error, msg);
          done(error);
          return;
        }
      });
    } else {
      this.error('missing sftp configuration');
      done(this.error);
    }
  }
  RED.nodes.registerType('sftp in', SFtpInNode);
};
