import AppKit
import Foundation
import iTunesLibrary

struct AlbumRecord: Encodable {
    let id: String
    let name: String
    let artist: String
    let front: String
    let back: String
}

func argument(_ name: String, fallback: String? = nil) -> String? {
    guard let index = CommandLine.arguments.firstIndex(of: name), CommandLine.arguments.indices.contains(index + 1) else {
        return fallback
    }

    return CommandLine.arguments[index + 1]
}

func stableHash(_ value: String) -> String {
    var hash: UInt64 = 0xcbf29ce484222325
    for byte in value.utf8 {
        hash ^= UInt64(byte)
        hash &*= 0x100000001b3
    }
    return String(hash, radix: 16)
}

func jpegData(from image: NSImage) -> Data? {
    guard let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff) else {
        return nil
    }

    return bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.9])
}

let outputDirectory = URL(fileURLWithPath: argument("--output") ?? "local-data/music", isDirectory: true)
let limit = min(max(Int(argument("--limit", fallback: "2000") ?? "2000") ?? 2000, 8), 5000)
let artworkDirectory = outputDirectory.appendingPathComponent("artwork", isDirectory: true)

try FileManager.default.createDirectory(at: artworkDirectory, withIntermediateDirectories: true)

let library = try ITLibrary(apiVersion: "1.1")
var seenAlbums = Set<String>()
var records: [AlbumRecord] = []

for item in library.allMediaItems {
    if records.count >= limit { break }
    if item.mediaKind != .kindSong { continue }
    guard let artwork = item.artwork, let image = artwork.image else { continue }

    let albumName = (item.album.title ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    if albumName.isEmpty { continue }

    let albumArtist = item.album.albumArtist ?? ""
    let artistName = (albumArtist.isEmpty ? item.artist?.name ?? "" : albumArtist).trimmingCharacters(in: .whitespacesAndNewlines)
    let albumKey = "\(artistName)\u{0}\(albumName)"
    if seenAlbums.contains(albumKey) { continue }

    let filename = "\(stableHash(albumKey)).jpg"
    let artworkURL = artworkDirectory.appendingPathComponent(filename)

    if !FileManager.default.fileExists(atPath: artworkURL.path) {
        guard let data = jpegData(from: image) else { continue }
        try data.write(to: artworkURL, options: .atomic)
    }

    seenAlbums.insert(albumKey)
    records.append(
        AlbumRecord(
            id: "local-music-\(stableHash(albumKey))",
            name: albumName,
            artist: artistName,
            front: "/local-data/music/artwork/\(filename)",
            back: "/local-data/music/artwork/\(filename)",
        )
    )
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
FileHandle.standardOutput.write(try encoder.encode(records))
