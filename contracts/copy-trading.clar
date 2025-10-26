;; Contrato base para gestionar estrategias de copy trading en Bitcoin L2 (Stacks).
;; Permite registrar estrategias auditadas y delegar capital con parámetros de riesgo.

(define-constant ERR-UNAUTHORIZED u100)
(define-constant ERR-STRATEGY-NOT-FOUND u101)
(define-constant ERR-STRATEGY-INACTIVE u102)
(define-constant ERR-INVALID-RISK u103)

(define-data-var owner principal tx-sender)
(define-data-var platform-paused bool false)

(define-map strategies
  { id: uint }
  {
    trader: principal,
    vault: principal,
    risk-level: uint,
    max-drawdown-bps: uint,
    fee-bps: uint,
    active: bool
  }
)

(define-map allocations
  { follower: principal, strategy-id: uint }
  {
    amount: uint,
    risk-multiplier-bps: uint,
    stop-loss-bps: uint,
    auto-rebalance: bool
  }
)

(define-public (set-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-UNAUTHORIZED)
    (var-set owner new-owner)
    (ok new-owner)
  )
)

(define-public (pause-platform (status bool))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-UNAUTHORIZED)
    (var-set platform-paused status)
    (ok status)
  )
)

(define-public (upsert-strategy
    (id uint)
    (trader principal)
    (vault principal)
    (risk-level uint)
    (max-drawdown-bps uint)
    (fee-bps uint)
    (active bool))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-UNAUTHORIZED)
    (asserts! (<= risk-level u3) ERR-INVALID-RISK)
    (map-set strategies
      { id: id }
      {
        trader: trader,
        vault: vault,
        risk-level: risk-level,
        max-drawdown-bps: max-drawdown-bps,
        fee-bps: fee-bps,
        active: active
      }
    )
    (ok id)
  )
)

(define-read-only (get-strategy (id uint))
  (map-get? strategies { id: id })
)

(define-public (allocate
    (id uint)
    (amount uint)
    (risk-multiplier-bps uint)
    (stop-loss-bps uint)
    (auto-rebalance bool))
  (begin
    (asserts! (not (var-get platform-paused)) ERR-STRATEGY-INACTIVE)
    (asserts!
      (and (>= risk-multiplier-bps u50) (<= risk-multiplier-bps u180))
      ERR-INVALID-RISK)
    (asserts! (<= stop-loss-bps u1500) ERR-INVALID-RISK)
    (match (map-get? strategies { id: id })
      strategy-data
        (begin
          (asserts! (get active strategy-data) ERR-STRATEGY-INACTIVE)
          (map-set allocations
            { follower: tx-sender, strategy-id: id }
            {
              amount: amount,
              risk-multiplier-bps: risk-multiplier-bps,
              stop-loss-bps: stop-loss-bps,
              auto-rebalance: auto-rebalance
            }
          )
          (ok amount)
        )
      none (err ERR-STRATEGY-NOT-FOUND)
    )
  )
)

(define-read-only (get-allocation (follower principal) (id uint))
  (map-get? allocations { follower: follower, strategy-id: id })
)

(define-public (cancel-allocation (id uint))
  (begin
    (map-delete allocations { follower: tx-sender, strategy-id: id })
    (ok true)
  )
)
