/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import * as Express from "express";
import * as FS from "fs";
import * as Path from "path";
import * as Cors from "cors";

export enum FileType {
	song,
	video,
	pdf,
	unknown
}

export interface Directory {
	name: string;
	children: (Directory | File)[];
}

export interface File {
	name: string;
	url: string;
	type: FileType;
}


const ROOT_FILE_PATH: string = "/home/nmcmusic/app-data";

function nameFromPath(path: string): string {
	if (path === ROOT_FILE_PATH) return "";
	const segments = path.split("/");
	return segments[segments.length - 1];
}

function extensionFromPath(path: string): string {
	const segments = path.split(".");
	return segments[segments.length - 1];
}

function getUrlFromPath(path: string): string {
	path = path.replace(ROOT_FILE_PATH, "");
	path = "/file" + path;
	path = encodeURI(path);
	return path;
}

function buildDirectory(path: string): Directory {

	const dir: string[] = FS.readdirSync(path);
	const children: (Directory | File)[] = [];

	for (const child of dir) {

		const childPath = Path.resolve(path, child);
		const stat = FS.lstatSync(childPath);

		if (stat.isDirectory()) {

			children.push(buildDirectory(childPath));

		} else {

			const extension = extensionFromPath(childPath);
			let fileType: FileType;

			switch (extension.toLowerCase()) {
				case "mp4":
				case "mov":
					fileType = FileType.video;
					break;
				case "mp3":
				case "aac":
				case "wav":
					fileType = FileType.song;
					break;
				case "pdf":
					fileType = FileType.pdf;
					break;
				default:
					fileType = FileType.unknown;
			}

			if (fileType === FileType.unknown) continue;

			children.push({
				name: nameFromPath(childPath),
				url: getUrlFromPath(childPath),
				type: fileType
			});

		}

	}

	return {
		name: nameFromPath(path),
		children
	};

}

const express = Express();

express.use(Cors());

express.get("/api/files", async(req: Express.Request, res: Express.Response) => {

	res.send(buildDirectory(ROOT_FILE_PATH));

});

express.get("/api/file/*", async (req: Express.Request, res: Express.Response) => {

	const url = req.url.replace("/api/file", "");
	const fullPath = ROOT_FILE_PATH + decodeURI(url);
	if (!FS.existsSync(fullPath)) return res.status(404).send({error: "File does not exist."});
	res.sendFile(fullPath);

});

express.listen(5239, () => console.log("Server Started"));
