# @yousolution/node-red-contrib-you-ftp-sftp

A Node-RED node to FTP and SFTP Client (_fork node-red-contrib-ftp-sftp_).

**Adds FTP/SFTP error handling**

Please log issues in the repo for assistance.
(https://github.com/yousolution-cloud/node-red-contrib-you-ftp-sftp.git)

## Install

Run the following command in the root directory of your Node-RED install

    npm install @yousolution/node-red-contrib-you-ftp-sftp

## Configuration

process.env.SFTP_SSH_KEY_FILE - If you want to use private SSH key set this environment variable

## SFTP & FTP

PUT - Set msg.payload.filedata to the file contents you want pushed and will be uploaded to {GUID}.FileExtension. If you need more changes file request to github.

GET - Set msg.payload.filename to get the file or will use Workdir + Filename in configuration. Leave configuration blank to set in code.

RENAME - Set msg.payload.filename and msg.payload.newfilename Leave configuration blank to set in code.

DELETE - Set msg.payload.filename to delete the file or will use Workdir + Filename in configuration. Leave configuration blank to set in code.

LIST - Uses the workdir

## Sample Function Node

<PRE>
// ----------------------------------------------------
//      All functions above use information.
//      Sample Javascript Used In Function Node
// ----------------------------------------------------
msg.payload = {};
msg.payload.filename="./SAMPLE_FILE.txt"; // Full Path
msg.payload.filedata='{}'; // Needs to be a string
return msg;
// ----------------------------------------------------
</PRE>

## Acknowledgements

The node-red-contrib-force uses the following open source software:

- [node-ftp-sftp](https://github.com/yousolution-cloud/node-red-contrib-you-ftp-sftp): node-ftp is an FTP and SFTP client module for node.js that provides an asynchronous interface for communicating with an FTP and SFTP servers.

## License

See [license](https://github.com/yousolution-cloud/node-red-contrib-you-ftp-sftp/blob/master/LICENSE) (Apache License Version 2.0).
