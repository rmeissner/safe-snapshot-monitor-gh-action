import { Trigger } from "./types";

export const triggerToBranch = (trigger: Trigger): string => {
    return `${trigger.type}/${trigger.id}`
}

export const triggerToDetailsPath = (trigger: Trigger): string => {
    return triggerToBranch(trigger) + '/details.json'
}