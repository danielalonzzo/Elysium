import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count >= 3 else { fputs("uso: cutout <in> <out.png>\n", stderr); exit(2) }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])

guard let ciImage = CIImage(contentsOf: inURL) else { fputs("no se pudo leer la imagen\n", stderr); exit(1) }

let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
let request = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([request]) } catch {
    fputs("Vision falló: \(error)\n", stderr); exit(1)
}
guard let result = request.results?.first else { fputs("sin sujeto detectado\n", stderr); exit(1) }
fputs("instancias: \(result.allInstances.count)\n", stderr)

let maskBuffer = try! result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
let mask = CIImage(cvPixelBuffer: maskBuffer)

let filter = CIFilter(name: "CIBlendWithMask")!
filter.setValue(ciImage, forKey: kCIInputImageKey)
filter.setValue(CIImage(color: .clear).cropped(to: ciImage.extent), forKey: kCIInputBackgroundImageKey)
filter.setValue(mask, forKey: kCIInputMaskImageKey)
guard let output = filter.outputImage else { fputs("blend falló\n", stderr); exit(1) }

let ctx = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
try! ctx.writePNGRepresentation(of: output, to: outURL, format: .RGBA8, colorSpace: cs)
fputs("ok -> \(outURL.path)\n", stderr)
