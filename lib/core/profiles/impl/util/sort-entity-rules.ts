import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"

export function sortEntityRules(ruleA: EntityRule, ruleB: EntityRule, handler: IProfileHandler) {
    const scoreA = getEntityRuleScore(ruleA, handler)
    const scoreB = getEntityRuleScore(ruleB, handler)
    if (scoreA === scoreB) return ruleA["@id"].localeCompare(ruleB["@id"], "en")
    else return scoreA > scoreB ? -1 : 1
}

function getEntityRuleScore(rule: EntityRule, handler: IProfileHandler) {
    let score = 0

    if (rule.specializationOf) {
        if (Array.isArray(rule.specializationOf)) {
            score += rule.specializationOf.length
        } else {
            score += 1
        }
    }

    score += handler.getPropertyRulesFor(rule["@id"]).length
    return score
}
