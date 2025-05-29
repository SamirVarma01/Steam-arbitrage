"use client";

import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
import React, { useState, useEffect } from 'react'
import axios from 'axios'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriceChart } from "@/components/price-chart"
import { MobileNav } from "@/components/mobile-nav"
import { Select } from "@/components/ui/select"

interface PriceData {
  keyPriceInRef: number;
  refPriceInUSD: number;
  keyPriceInUSD: number;
  lastUpdated: string;
}

interface PriceHistoryPoint {
  timestamp: number;
  value: number;
}

interface PriceHistoryData {
  item: string;
  points: PriceHistoryPoint[];
}

export default function Home() {
  const [currentPrices, setCurrentPrices] = useState<PriceData | null>(null)
  const [keyHistory, setKeyHistory] = useState<PriceHistoryData | null>(null)
  const [refinedHistory, setRefinedHistory] = useState<PriceHistoryData | null>(null)
  const [timeframe, setTimeframe] = useState<string>('3years')
  const [selectedItem, setSelectedItem] = useState<string>('refined')
  const [loadingPrices, setLoadingPrices] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [errorPrices, setErrorPrices] = useState<string | null>(null)
  const [errorHistory, setErrorHistory] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoadingPrices(true)
        const response = await axios.get('http://localhost:8080/api/prices')
        setCurrentPrices(response.data)
      } catch (err) {
        console.error("Error fetching current prices:", err)
        setErrorPrices("Failed to fetch current prices.")
      } finally {
        setLoadingPrices(false)
      }
    }
    fetchPrices()
  }, [])

  useEffect(() => {
    const fetchHistory = async (item: string, setter: React.Dispatch<React.SetStateAction<PriceHistoryData | null>>) => {
      try {
        setLoadingHistory(true)
        const response = await axios.get(`http://localhost:8080/api/prices/history?item=${encodeURIComponent(item)}&quality=6&timeframe=${timeframe}`)
        setter(response.data)
      } catch (err) {
        console.error(`Error fetching ${item} history:`, err)
        setErrorHistory(`Failed to fetch ${item} price history.`)
      } finally {
        setLoadingHistory(false)
      }
    }

    // Fetch history for both items when timeframe changes
    fetchHistory('Mann Co. Supply Crate Key', setKeyHistory)
    fetchHistory('Refined Metal', setRefinedHistory)

  }, [timeframe]) // Dependency is only timeframe

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-950 via-blue-900 to-black text-white">
      <header className="sticky top-0 z-40 w-full border-b border-blue-800/40 bg-blue-950/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between pl-4 md:pl-8">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="hidden sm:inline-block">TF2 Trading Stats</span>
              <span className="sm:hidden">TF2 Stats</span>
            </Link>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-blue-300">
              Home
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-blue-300">
              Market
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-blue-300">
              Items
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-blue-300">
              About
            </Link>
          </nav>
          <MobileNav />
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto max-w-screen-lg px-4 py-8 md:py-12 flex flex-col items-center">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 text-center">
                  TF2 Trading Statistics
                </h1>
                <p className="max-w-2xl text-blue-200 md:text-xl mb-6 text-center">
                  Real-time market data and historical trends for Team Fortress 2 trading.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  View Market
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-blue-700 text-blue-100 hover:bg-blue-800/50">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-blue-900/40 border-blue-800 text-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-blue-300">Current Price</CardDescription>
                  <CardTitle className="text-2xl">Refined Metal</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHistory && <div className="text-3xl font-bold">Loading...</div>}
                  {errorHistory && <div className="text-sm text-red-400">{errorHistory}</div>}
                  {!loadingHistory && !errorHistory && refinedHistory && refinedHistory.points.length > 0 && (
                    <>
                      <div className="text-3xl font-bold">
                        {`${refinedHistory.points[refinedHistory.points.length - 1].value.toFixed(3)} USD`}
                      </div>
                      <div className="text-sm text-blue-300 mt-1">Last updated: {new Date(refinedHistory.points[refinedHistory.points.length - 1].timestamp * 1000).toLocaleTimeString()}</div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-blue-900/40 border-blue-800 text-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-blue-300">Current Price</CardDescription>
                  <CardTitle className="text-2xl">Mann Co. Key</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPrices && <div className="text-3xl font-bold">Loading...</div>}
                  {errorPrices && <div className="text-sm text-red-400">{errorPrices}</div>}
                  {currentPrices && (
                    <>
                      <div className="text-3xl font-bold">
                        {`${currentPrices.keyPriceInRef.toFixed(2)} Ref`}
                      </div>
                      <div className="text-sm text-blue-300 mt-1">Last updated: {new Date(currentPrices.lastUpdated).toLocaleTimeString()}</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section className="container mx-auto max-w-screen-lg px-4 py-8 md:py-12">
          <Card className="bg-blue-900/30 border-blue-800 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Historical Price Data</CardTitle>
              <CardDescription className="text-blue-300">
                Track price trends over time for TF2 currencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="30days" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-blue-950/50">
                    <TabsTrigger value="30days" onClick={() => setTimeframe('30days')}>30 Days</TabsTrigger>
                    <TabsTrigger value="90days" onClick={() => setTimeframe('90days')}>90 Days</TabsTrigger>
                    <TabsTrigger value="1year" onClick={() => setTimeframe('1year')}>1 Year</TabsTrigger>
                    <TabsTrigger value="3years" onClick={() => setTimeframe('3years')}>3 Years</TabsTrigger>
                  </TabsList>
                  <Select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    options={[
                      { value: 'refined', label: 'Refined Metal' },
                      { value: 'key', label: 'Mann Co. Key' },
                    ]}
                    className="bg-blue-950/50"
                  />
                </div>
                <TabsContent value="7days">
                  <div className="h-[400px]">
                    {loadingHistory && <div className="text-blue-300">Loading chart data...</div>}
                    {errorHistory && <div className="text-red-400">{errorHistory}</div>}
                    {!loadingHistory && !errorHistory && refinedHistory && keyHistory && (
                      <PriceChart refinedData={refinedHistory.points} keyData={keyHistory.points} selectedItem={selectedItem} />
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="30days">
                  <div className="h-[400px]">
                    {loadingHistory && <div className="text-blue-300">Loading chart data...</div>}
                    {errorHistory && <div className="text-red-400">{errorHistory}</div>}
                    {!loadingHistory && !errorHistory && refinedHistory && keyHistory && (
                      <PriceChart 
                        refinedData={refinedHistory.points} 
                        keyData={keyHistory.points} 
                        selectedItem={selectedItem}
                      />
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="90days">
                  <div className="h-[400px]">
                    {loadingHistory && <div className="text-blue-300">Loading chart data...</div>}
                    {errorHistory && <div className="text-red-400">{errorHistory}</div>}
                    {!loadingHistory && !errorHistory && refinedHistory && keyHistory && (
                      <PriceChart 
                        refinedData={refinedHistory.points} 
                        keyData={keyHistory.points} 
                        selectedItem={selectedItem}
                      />
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="1year">
                  <div className="h-[400px]">
                    {loadingHistory && <div className="text-blue-300">Loading chart data...</div>}
                    {errorHistory && <div className="text-red-400">{errorHistory}</div>}
                    {!loadingHistory && !errorHistory && refinedHistory && keyHistory && (
                      <PriceChart 
                        refinedData={refinedHistory.points} 
                        keyData={keyHistory.points} 
                        selectedItem={selectedItem}
                      />
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="3years">
                  <div className="h-[400px]">
                    {loadingHistory && <div className="text-blue-300">Loading chart data...</div>}
                    {errorHistory && <div className="text-red-400">{errorHistory}</div>}
                    {!loadingHistory && !errorHistory && refinedHistory && keyHistory && (
                      <PriceChart 
                        refinedData={refinedHistory.points} 
                        keyData={keyHistory.points} 
                        selectedItem={selectedItem}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
        <section className="container mx-auto max-w-screen-lg px-4 py-8 md:py-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-blue-900/40 border-blue-800 text-white">
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription className="text-blue-300">Latest trading trends and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/20 p-1">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Unusual market:</span> Prices stabilizing after Summer Sale
                      fluctuations
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/20 p-1">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Key ratio:</span> Currently at 72.33 refined per key
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/20 p-1">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Trading volume:</span> 15% increase in the past week
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/40 border-blue-800 text-white">
              <CardHeader>
                <CardTitle>Top Traded Items</CardTitle>
                <CardDescription className="text-blue-300">Most popular items in the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-blue-800/50" />
                      <span>Unusual Team Captain</span>
                    </div>
                    <span className="text-green-400">+12.5%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-blue-800/50" />
                      <span>Australium Rocket Launcher</span>
                    </div>
                    <span className="text-red-400">-3.2%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-blue-800/50" />
                      <span>Strange Killstreak Scattergun</span>
                    </div>
                    <span className="text-green-400">+5.7%</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/40 border-blue-800 text-white md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Trading News</CardTitle>
                <CardDescription className="text-blue-300">Latest updates from the TF2 economy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">New Unusual Effects Released</h3>
                    <p className="text-sm text-blue-200">
                      Valve has introduced 5 new unusual effects in the latest update, causing market fluctuations.
                    </p>
                    <div className="text-xs text-blue-400">2 days ago</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Summer Sale Impact</h3>
                    <p className="text-sm text-blue-200">
                      The Steam Summer Sale has caused a temporary dip in key prices as players sell items for wallet
                      funds.
                    </p>
                    <div className="text-xs text-blue-400">5 days ago</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t border-blue-800/40 bg-blue-950/80 py-6">
        <div className="container mx-auto max-w-screen-lg flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-blue-300 md:text-left">
            &copy; {new Date().getFullYear()} TF2 Trading Stats. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link href="#" className="text-sm text-blue-300 hover:text-blue-100">
              Terms
            </Link>
            <Link href="#" className="text-sm text-blue-300 hover:text-blue-100">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-blue-300 hover:text-blue-100">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}