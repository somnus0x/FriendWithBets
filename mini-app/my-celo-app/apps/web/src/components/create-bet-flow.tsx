"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMiniApp } from "@/contexts/miniapp-context"
import { useAccount } from "wagmi"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ApeButton } from "@/components/ape-button"
import { FakeChain, Market } from "@/lib/fakeChain"

interface CreateBetFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuestion?: string
  onMarketCreated?: (market: Market) => void
}

export function CreateBetFlow({
  open,
  onOpenChange,
  initialQuestion = "Will Vitalik Have 500k Follower By Friday?",
  onMarketCreated,
}: CreateBetFlowProps) {
  const router = useRouter()
  const { context } = useMiniApp()
  const { address } = useAccount()
  const user = context?.user

  const [topic, setTopic] = useState(initialQuestion)
  const [condition, setCondition] = useState("Farcaster Reported Follower > 500k")
  const [timePeriod, setTimePeriod] = useState("2025-11-29")
  const [isCreating, setIsCreating] = useState(false)

  // Update topic when initialQuestion changes
  useEffect(() => {
    if (open && initialQuestion) {
      setTopic(initialQuestion)
    }
  }, [open, initialQuestion])

  const getUserAddress = () => {
    return address || user?.custody || user?.verifications?.[0] || "0xDemoUser"
  }

  const handleCreate = () => {
    if (!topic.trim()) return

    setIsCreating(true)

    try {
      const now = Math.floor(Date.now() / 1000)
      // Parse date string (YYYY-MM-DD) or fallback to hours
      let closeTime: number
      if (timePeriod.includes("-")) {
        // Date format
        const date = new Date(timePeriod)
        closeTime = Math.floor(date.getTime() / 1000)
      } else {
        // Hours format (fallback)
        const hours = parseInt(timePeriod) || 24
        closeTime = now + hours * 3600
      }
      const resolveTime = closeTime + 3600 // 1 hour after close time

      const creator = getUserAddress()
      const question = condition.trim()
        ? `${topic.trim()} - ${condition.trim()}`
        : topic.trim()

      const market = FakeChain.createMarket(question, creator, closeTime, resolveTime)

      // Reset form
      setTopic("")
      setCondition("")
      setTimePeriod("2025-11-29")
      
      // Close dialog first
      onOpenChange(false)
      
      // Call callback if provided (for single-page app), otherwise navigate
      if (onMarketCreated) {
        setTimeout(() => {
          onMarketCreated(market)
        }, 100)
      } else {
        setTimeout(() => {
          router.push(`/market/${market.id}`)
        }, 100)
      }
    } catch (error) {
      console.error("Failed to create market:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-casino-gold text-2xl">Create New Bet</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fill in the details to create your bet market
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="topic">Bet Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g., Will ETH hit $5k before New Year?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === "Enter" && topic.trim()) {
                  handleCreate()
                }
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="condition">Condition / Details</Label>
            <Input
              id="condition"
              placeholder="Additional details or conditions (optional)"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="timePeriod">Settled Date</Label>
            <Input
              id="timePeriod"
              type="date"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              How long the market will be open for betting
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <ApeButton onClick={handleCreate} disabled={!topic.trim() || isCreating}>
            {isCreating ? "Creating..." : "Create Bet"}
          </ApeButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

