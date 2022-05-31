import Foundation
import Models
import SwiftGraphQL

public extension DataService {
  func savePage(pageScrapePayload: PageScrapePayload, html: String, title: String?, requestId: String) async throws {
    enum MutationResult {
      case saved(requestId: String, url: String)
      case error(errorCode: Enums.SaveErrorCode)
    }

    let input = InputObjects.SavePageInput(
      url: pageScrapePayload.url,
      source: "ios-page",
      clientRequestId: requestId,
      title: OptionalArgument(title),
      originalContent: html
    )

    let selection = Selection<MutationResult, Unions.SaveResult> {
      try $0.on(
        saveSuccess: .init { .saved(requestId: requestId, url: (try? $0.url()) ?? "") },
        saveError: .init {
          .error(errorCode: (try? $0.errorCodes().first) ?? .unknown)
        }
      )
    }

    let mutation = Selection.Mutation {
      try $0.savePage(input: input, selection: selection)
    }

    let path = appEnvironment.graphqlPath
    let headers = networker.defaultHeaders

    return try await withCheckedThrowingContinuation { continuation in
      send(mutation, to: path, headers: headers) { result in
        switch result {
        case let .success(payload):
          if let graphqlError = payload.errors {
            continuation.resume(
              throwing: SaveArticleError.unknown(description: graphqlError.first.debugDescription)
            )
            return
          }

          switch payload.data {
          case .saved:
            continuation.resume()
          case let .error(errorCode: errorCode):
            switch errorCode {
            case .unauthorized:
              continuation.resume(throwing: SaveArticleError.unauthorized)
            default:
              continuation.resume(throwing: SaveArticleError.unknown(description: errorCode.rawValue))
            }
          }
        case let .failure(error):
          continuation.resume(throwing: SaveArticleError.make(from: error))
        }
      }
    }
  }
}

private extension SaveArticleError {
  static func make(from httpError: HttpError) -> SaveArticleError {
    switch httpError {
    case .network, .timeout:
      return .network
    case .badpayload, .badURL, .badstatus, .cancelled:
      return .unknown(description: httpError.localizedDescription)
    }
  }
}
