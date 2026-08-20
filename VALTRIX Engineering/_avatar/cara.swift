import Foundation
import Vision
import CoreImage

let args = CommandLine.arguments
guard args.count >= 2 else { exit(2) }
let url = URL(fileURLWithPath: args[1])
guard let ci = CIImage(contentsOf: url) else { exit(1) }
let W = ci.extent.width, H = ci.extent.height
let handler = VNImageRequestHandler(ciImage: ci, options: [:])
let req = VNDetectFaceLandmarksRequest()
try! handler.perform([req])
for obs in (req.results ?? []) {
    let b = obs.boundingBox
    // Vision: origen abajo-izquierda, normalizado
    let x = b.minX * W, w = b.width * W
    let yTop = (1 - b.maxY) * H, h = b.height * H
    print("caja \(Int(x)) \(Int(yTop)) \(Int(w)) \(Int(h))")
    if let lm = obs.landmarks {
        func pt(_ r: VNFaceLandmarkRegion2D?, _ name: String) {
            guard let r = r else { return }
            var sx = 0.0, sy = 0.0
            for p in r.normalizedPoints { sx += Double(p.x); sy += Double(p.y) }
            let n = Double(r.pointCount)
            let px = x + (sx/n) * w
            let py = yTop + (1 - (sy/n)) * h
            print("\(name) \(Int(px)) \(Int(py))")
        }
        pt(lm.leftEye, "ojoIzq"); pt(lm.rightEye, "ojoDer")
        pt(lm.nose, "nariz"); pt(lm.outerLips, "boca")
        if let fc = lm.faceContour {
            var maxY = 0.0
            for p in fc.normalizedPoints { maxY = max(maxY, 1 - Double(p.y)) }
            print("menton \(Int(yTop + maxY * h))")
        }
    }
}
