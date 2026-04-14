export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          active: boolean
          advertiser_id: string
          budget: number
          clicks: number
          cpm: number
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          impressions: number
          link_url: string | null
          slot_type: string
          spent: number
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          advertiser_id: string
          budget?: number
          clicks?: number
          cpm?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          link_url?: string | null
          slot_type?: string
          spent?: number
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          advertiser_id?: string
          budget?: number
          clicks?: number
          cpm?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          link_url?: string | null
          slot_type?: string
          spent?: number
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_brain_settings: {
        Row: {
          auto_flag_threshold: number
          chatgpt_enabled: boolean
          claude_enabled: boolean
          deepseek_enabled: boolean
          gemini_enabled: boolean
          id: number
          moderation_active: boolean
          sentiment_analysis: boolean
          updated_at: string
        }
        Insert: {
          auto_flag_threshold?: number
          chatgpt_enabled?: boolean
          claude_enabled?: boolean
          deepseek_enabled?: boolean
          gemini_enabled?: boolean
          id?: number
          moderation_active?: boolean
          sentiment_analysis?: boolean
          updated_at?: string
        }
        Update: {
          auto_flag_threshold?: number
          chatgpt_enabled?: boolean
          claude_enabled?: boolean
          deepseek_enabled?: boolean
          gemini_enabled?: boolean
          id?: number
          moderation_active?: boolean
          sentiment_analysis?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          site_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role?: string
          site_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          id: string
          interactions_paid: number
          interactions_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          interactions_paid?: number
          interactions_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          interactions_paid?: number
          interactions_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      boost_tickets: {
        Row: {
          boost_id: string
          created_at: string
          drawn: boolean
          id: string
          user_id: string
          video_id: string
          won: boolean
        }
        Insert: {
          boost_id: string
          created_at?: string
          drawn?: boolean
          id?: string
          user_id: string
          video_id: string
          won?: boolean
        }
        Update: {
          boost_id?: string
          created_at?: string
          drawn?: boolean
          id?: string
          user_id?: string
          video_id?: string
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "boost_tickets_boost_id_fkey"
            columns: ["boost_id"]
            isOneToOne: false
            referencedRelation: "boosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boost_tickets_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      boosts: {
        Row: {
          amount: number
          created_at: string
          id: string
          to_creator: number
          to_platform: number
          to_pool: number
          user_id: string
          video_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          to_creator?: number
          to_platform?: number
          to_pool?: number
          user_id: string
          video_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          to_creator?: number
          to_platform?: number
          to_pool?: number
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boosts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          id: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      collection_purchases: {
        Row: {
          buyer_id: string
          collection_id: string
          created_at: string | null
          creator_share: number
          id: string
          platform_share: number
          polygon_hash: string | null
          price_per_unit: number
          quantity: number | null
          total_paid: number
        }
        Insert: {
          buyer_id: string
          collection_id: string
          created_at?: string | null
          creator_share: number
          id?: string
          platform_share: number
          polygon_hash?: string | null
          price_per_unit: number
          quantity?: number | null
          total_paid: number
        }
        Update: {
          buyer_id?: string
          collection_id?: string
          created_at?: string | null
          creator_share?: number
          id?: string
          platform_share?: number
          polygon_hash?: string | null
          price_per_unit?: number
          quantity?: number | null
          total_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_purchases_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "nft_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          company_email: string | null
          company_name: string
          created_at: string
          expires_at: string
          id: string
          plan_price: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_email?: string | null
          company_name: string
          created_at?: string
          expires_at?: string
          id?: string
          plan_price?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_email?: string | null
          company_name?: string
          created_at?: string
          expires_at?: string
          id?: string
          plan_price?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cv_unlocks: {
        Row: {
          amount_paid: number
          buyer_id: string
          created_at: string
          creator_id: string
          creator_share: number
          id: string
          platform_share: number
          site_id: string
        }
        Insert: {
          amount_paid?: number
          buyer_id: string
          created_at?: string
          creator_id: string
          creator_share?: number
          id?: string
          platform_share?: number
          site_id: string
        }
        Update: {
          amount_paid?: number
          buyer_id?: string
          created_at?: string
          creator_id?: string
          creator_share?: number
          id?: string
          platform_share?: number
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_unlocks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      dividend_payouts: {
        Row: {
          amount: number
          created_at: string
          dividend_id: string | null
          holder_id: string
          id: string
          polygon_hash: string | null
          shares_held: number
          source: string
          video_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          dividend_id?: string | null
          holder_id: string
          id?: string
          polygon_hash?: string | null
          shares_held?: number
          source: string
          video_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          dividend_id?: string | null
          holder_id?: string
          id?: string
          polygon_hash?: string | null
          shares_held?: number
          source?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dividend_payouts_dividend_id_fkey"
            columns: ["dividend_id"]
            isOneToOne: false
            referencedRelation: "dividends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividend_payouts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      dividends: {
        Row: {
          distributed_at: string
          id: string
          per_share_amount: number
          source: string
          total_amount: number
          video_id: string
        }
        Insert: {
          distributed_at?: string
          id?: string
          per_share_amount: number
          source: string
          total_amount: number
          video_id: string
        }
        Update: {
          distributed_at?: string
          id?: string
          per_share_amount?: number
          source?: string
          total_amount?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dividends_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_escrows: {
        Row: {
          amount: number
          buyer_confirmed: boolean
          buyer_id: string
          created_at: string
          currency: string
          domain_name: string
          id: string
          listing_id: string | null
          net_to_seller: number
          payment_method: string
          platform_fee_amount: number
          platform_fee_pct: number
          released_at: string | null
          seller_confirmed: boolean
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          buyer_confirmed?: boolean
          buyer_id: string
          created_at?: string
          currency?: string
          domain_name: string
          id?: string
          listing_id?: string | null
          net_to_seller?: number
          payment_method?: string
          platform_fee_amount?: number
          platform_fee_pct?: number
          released_at?: string | null
          seller_confirmed?: boolean
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_confirmed?: boolean
          buyer_id?: string
          created_at?: string
          currency?: string
          domain_name?: string
          id?: string
          listing_id?: string | null
          net_to_seller?: number
          payment_method?: string
          platform_fee_amount?: number
          platform_fee_pct?: number
          released_at?: string | null
          seller_confirmed?: boolean
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_escrows_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "domain_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_listings: {
        Row: {
          accept_crypto: boolean
          accept_stripe: boolean
          category: string
          created_at: string
          currency: string
          description: string | null
          domain_name: string
          domain_type: string
          domain_url: string | null
          id: string
          price: number
          registrar: string | null
          seller_id: string
          status: string
          tld: string | null
          updated_at: string
        }
        Insert: {
          accept_crypto?: boolean
          accept_stripe?: boolean
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          domain_name: string
          domain_type?: string
          domain_url?: string | null
          id?: string
          price?: number
          registrar?: string | null
          seller_id: string
          status?: string
          tld?: string | null
          updated_at?: string
        }
        Update: {
          accept_crypto?: boolean
          accept_stripe?: boolean
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          domain_name?: string
          domain_type?: string
          domain_url?: string | null
          id?: string
          price?: number
          registrar?: string | null
          seller_id?: string
          status?: string
          tld?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          content: string
          created_at: string
          expires_at: string
          id: string
          image_url: string | null
          pinned: boolean
          pinned_until: string | null
          site_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          pinned_until?: string | null
          site_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          pinned_until?: string | null
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      futures_contracts: {
        Row: {
          contract_multiplier: number
          created_at: string
          enabled: boolean
          expiry_date: string
          fee_close_pct: number
          fee_open_pct: number
          id: string
          initial_margin_pct: number
          last_price: number | null
          maintenance_margin_pct: number
          max_leverage: number
          open_interest: number | null
          short_enabled: boolean
          symbol: string
          updated_at: string
          volume_24h: number | null
        }
        Insert: {
          contract_multiplier?: number
          created_at?: string
          enabled?: boolean
          expiry_date: string
          fee_close_pct?: number
          fee_open_pct?: number
          id?: string
          initial_margin_pct?: number
          last_price?: number | null
          maintenance_margin_pct?: number
          max_leverage?: number
          open_interest?: number | null
          short_enabled?: boolean
          symbol: string
          updated_at?: string
          volume_24h?: number | null
        }
        Update: {
          contract_multiplier?: number
          created_at?: string
          enabled?: boolean
          expiry_date?: string
          fee_close_pct?: number
          fee_open_pct?: number
          id?: string
          initial_margin_pct?: number
          last_price?: number | null
          maintenance_margin_pct?: number
          max_leverage?: number
          open_interest?: number | null
          short_enabled?: boolean
          symbol?: string
          updated_at?: string
          volume_24h?: number | null
        }
        Relationships: []
      }
      futures_orders: {
        Row: {
          contract_id: string
          created_at: string
          fee_paid: number
          filled_qty: number
          id: string
          margin_locked: number
          order_type: string
          price: number | null
          quantity: number
          side: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          fee_paid?: number
          filled_qty?: number
          id?: string
          margin_locked?: number
          order_type: string
          price?: number | null
          quantity: number
          side: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          fee_paid?: number
          filled_qty?: number
          id?: string
          margin_locked?: number
          order_type?: string
          price?: number | null
          quantity?: number
          side?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "futures_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "futures_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      futures_positions: {
        Row: {
          contract_id: string
          created_at: string
          entry_price: number
          id: string
          leverage: number
          liquidation_price: number | null
          margin_locked: number
          quantity: number
          side: string
          unrealized_pnl: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          entry_price: number
          id?: string
          leverage?: number
          liquidation_price?: number | null
          margin_locked?: number
          quantity?: number
          side: string
          unrealized_pnl?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          entry_price?: number
          id?: string
          leverage?: number
          liquidation_price?: number | null
          margin_locked?: number
          quantity?: number
          side?: string
          unrealized_pnl?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "futures_positions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "futures_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      futures_risk_limits: {
        Row: {
          circuit_breaker_pct: number
          circuit_breaker_window_minutes: number
          global_exposure_limit: number
          id: number
          max_position_per_user: number
          mock_mode: boolean
          trading_paused: boolean
          updated_at: string
        }
        Insert: {
          circuit_breaker_pct?: number
          circuit_breaker_window_minutes?: number
          global_exposure_limit?: number
          id?: number
          max_position_per_user?: number
          mock_mode?: boolean
          trading_paused?: boolean
          updated_at?: string
        }
        Update: {
          circuit_breaker_pct?: number
          circuit_breaker_window_minutes?: number
          global_exposure_limit?: number
          id?: number
          max_position_per_user?: number
          mock_mode?: boolean
          trading_paused?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      futures_trades: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          maker_fee: number
          maker_id: string
          maker_order_id: string | null
          price: number
          quantity: number
          taker_fee: number
          taker_id: string
          taker_order_id: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          maker_fee?: number
          maker_id: string
          maker_order_id?: string | null
          price: number
          quantity: number
          taker_fee?: number
          taker_id: string
          taker_order_id?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          maker_fee?: number
          maker_id?: string
          maker_order_id?: string | null
          price?: number
          quantity?: number
          taker_fee?: number
          taker_id?: string
          taker_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "futures_trades_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "futures_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "futures_trades_maker_order_id_fkey"
            columns: ["maker_order_id"]
            isOneToOne: false
            referencedRelation: "futures_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "futures_trades_taker_order_id_fkey"
            columns: ["taker_order_id"]
            isOneToOne: false
            referencedRelation: "futures_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      index_constituents: {
        Row: {
          engagement_score: number | null
          id: string
          market_cap: number | null
          normalized_score: number | null
          revenue_30d: number | null
          updated_at: string
          video_id: string
          volume_30d: number | null
          weight_pct: number
        }
        Insert: {
          engagement_score?: number | null
          id?: string
          market_cap?: number | null
          normalized_score?: number | null
          revenue_30d?: number | null
          updated_at?: string
          video_id: string
          volume_30d?: number | null
          weight_pct?: number
        }
        Update: {
          engagement_score?: number | null
          id?: string
          market_cap?: number | null
          normalized_score?: number | null
          revenue_30d?: number | null
          updated_at?: string
          video_id?: string
          volume_30d?: number | null
          weight_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "index_constituents_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      index_history: {
        Row: {
          change_24h: number | null
          change_7d: number | null
          constituents_down: number | null
          constituents_up: number | null
          hpi_value: number
          id: string
          recorded_at: string
          total_market_cap: number | null
          total_volume_24h: number | null
        }
        Insert: {
          change_24h?: number | null
          change_7d?: number | null
          constituents_down?: number | null
          constituents_up?: number | null
          hpi_value: number
          id?: string
          recorded_at?: string
          total_market_cap?: number | null
          total_volume_24h?: number | null
        }
        Update: {
          change_24h?: number | null
          change_7d?: number | null
          constituents_down?: number | null
          constituents_up?: number | null
          hpi_value?: number
          id?: string
          recorded_at?: string
          total_market_cap?: number | null
          total_volume_24h?: number | null
        }
        Relationships: []
      }
      index_settings: {
        Row: {
          base_value: number
          divisor: number
          enabled: boolean
          id: number
          min_age_days: number
          min_avg_monthly_revenue: number
          min_trading_volume_30d: number
          symbol: string
          update_interval_seconds: number
          updated_at: string
          weight_engagement: number
          weight_market_cap: number
          weight_revenue: number
          weight_volume: number
        }
        Insert: {
          base_value?: number
          divisor?: number
          enabled?: boolean
          id?: number
          min_age_days?: number
          min_avg_monthly_revenue?: number
          min_trading_volume_30d?: number
          symbol?: string
          update_interval_seconds?: number
          updated_at?: string
          weight_engagement?: number
          weight_market_cap?: number
          weight_revenue?: number
          weight_volume?: number
        }
        Update: {
          base_value?: number
          divisor?: number
          enabled?: boolean
          id?: number
          min_age_days?: number
          min_avg_monthly_revenue?: number
          min_trading_volume_30d?: number
          symbol?: string
          update_interval_seconds?: number
          updated_at?: string
          weight_engagement?: number
          weight_market_cap?: number
          weight_revenue?: number
          weight_volume?: number
        }
        Relationships: []
      }
      jackpot_pool: {
        Row: {
          id: number
          last_drawn_at: string | null
          last_winner_amount: number | null
          last_winner_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          id?: number
          last_drawn_at?: string | null
          last_winner_amount?: number | null
          last_winner_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          id?: number
          last_drawn_at?: string | null
          last_winner_amount?: number | null
          last_winner_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          active: boolean
          category: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          job_type: string
          location: string | null
          salary_range: string | null
          site_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          job_type?: string
          location?: string | null
          salary_range?: string | null
          site_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          job_type?: string
          location?: string | null
          salary_range?: string | null
          site_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_listings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          tx_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          tx_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          tx_type?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_site_links: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          site_id: string
          sort_order: number
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          site_id: string
          sort_order?: number
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          site_id?: string
          sort_order?: number
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_site_links_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_site_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          site_id: string
          sort_order: number
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          site_id: string
          sort_order?: number
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          site_id?: string
          sort_order?: number
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_site_photos_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_site_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nft_editions_sold: number
          nft_enabled: boolean
          nft_max_editions: number | null
          nft_max_views: number
          nft_price: number
          paywall_enabled: boolean | null
          paywall_price: number | null
          preview_url: string | null
          recharge_enabled: boolean | null
          recharge_price: number | null
          site_id: string
          sort_order: number
          thumbnail_url: string | null
          title: string
          user_id: string
          view_tier: number | null
          youtube_verification_code: string | null
          youtube_verified_at: string | null
          youtube_video_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nft_editions_sold?: number
          nft_enabled?: boolean
          nft_max_editions?: number | null
          nft_max_views?: number
          nft_price?: number
          paywall_enabled?: boolean | null
          paywall_price?: number | null
          preview_url?: string | null
          recharge_enabled?: boolean | null
          recharge_price?: number | null
          site_id: string
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          user_id: string
          view_tier?: number | null
          youtube_verification_code?: string | null
          youtube_verified_at?: string | null
          youtube_video_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nft_editions_sold?: number
          nft_enabled?: boolean
          nft_max_editions?: number | null
          nft_max_views?: number
          nft_price?: number
          paywall_enabled?: boolean | null
          paywall_price?: number | null
          preview_url?: string | null
          recharge_enabled?: boolean | null
          recharge_price?: number | null
          site_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          view_tier?: number | null
          youtube_verification_code?: string | null
          youtube_verified_at?: string | null
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_site_videos_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_sites: {
        Row: {
          address: string | null
          avatar_video_muted: boolean
          avatar_video_url: string | null
          avatar_url: string | null
          banner_url: string | null
          blog_enabled: boolean
          blog_pages: Json
          bg_style: string
          bio: string | null
          blocked: boolean
          boost_expires_at: string | null
          boost_rank: number
          contact_email: string | null
          contact_phone: string | null
          contact_price: number
          content_language: string
          created_at: string
          custom_css: string | null
          cv_content: string | null
          cv_education: Json | null
          cv_experience: Json | null
          cv_headline: string | null
          cv_location: string | null
          cv_portfolio: Json | null
          cv_skills: string[] | null
          font_size: string
          feed_mode: string
          id: string
          layout_columns: number
          monthly_price: number
          photo_shape: string
          photo_size: string
          published: boolean
          seo_description: string | null
          seo_image_url: string | null
          seo_title: string | null
          show_cv: boolean
          show_domains: boolean
          show_photos: boolean
          show_properties: boolean
          site_name: string | null
          slug: string
          template_id: string | null
          theme: string
          updated_at: string
          user_id: string
          wallet_login_enabled: boolean
        }
        Insert: {
          address?: string | null
          avatar_video_muted?: boolean
          avatar_video_url?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          blog_enabled?: boolean
          blog_pages?: Json
          bg_style?: string
          bio?: string | null
          blocked?: boolean
          boost_expires_at?: string | null
          boost_rank?: number
          contact_email?: string | null
          contact_phone?: string | null
          contact_price?: number
          content_language?: string
          created_at?: string
          custom_css?: string | null
          cv_content?: string | null
          cv_education?: Json | null
          cv_experience?: Json | null
          cv_headline?: string | null
          cv_location?: string | null
          cv_portfolio?: Json | null
          cv_skills?: string[] | null
          font_size?: string
          feed_mode?: string
          id?: string
          layout_columns?: number
          monthly_price?: number
          photo_shape?: string
          photo_size?: string
          published?: boolean
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          show_cv?: boolean
          show_domains?: boolean
          show_photos?: boolean
          show_properties?: boolean
          site_name?: string | null
          slug: string
          template_id?: string | null
          theme?: string
          updated_at?: string
          user_id: string
          wallet_login_enabled?: boolean
        }
        Update: {
          address?: string | null
          avatar_video_muted?: boolean
          avatar_video_url?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          blog_enabled?: boolean
          blog_pages?: Json
          bg_style?: string
          bio?: string | null
          blocked?: boolean
          boost_expires_at?: string | null
          boost_rank?: number
          contact_email?: string | null
          contact_phone?: string | null
          contact_price?: number
          content_language?: string
          created_at?: string
          custom_css?: string | null
          cv_content?: string | null
          cv_education?: Json | null
          cv_experience?: Json | null
          cv_headline?: string | null
          cv_location?: string | null
          cv_portfolio?: Json | null
          cv_skills?: string[] | null
          font_size?: string
          feed_mode?: string
          id?: string
          layout_columns?: number
          monthly_price?: number
          photo_shape?: string
          photo_size?: string
          published?: boolean
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          show_cv?: boolean
          show_domains?: boolean
          show_photos?: boolean
          show_properties?: boolean
          site_name?: string | null
          slug?: string
          template_id?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
          wallet_login_enabled?: boolean
        }
        Relationships: []
      }
      nft_collections: {
        Row: {
          arweave_hash: string | null
          created_at: string | null
          creator_id: string
          creator_pct: number | null
          description: string | null
          editions_minted: number | null
          id: string
          launch_fee_paid: number | null
          launched_at: string | null
          max_editions: number | null
          platform_pct: number | null
          polygon_hash: string | null
          price_per_nft: number
          recharge_enabled: boolean | null
          recharge_price: number | null
          site_id: string | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_id: string | null
          view_tier: number | null
        }
        Insert: {
          arweave_hash?: string | null
          created_at?: string | null
          creator_id: string
          creator_pct?: number | null
          description?: string | null
          editions_minted?: number | null
          id?: string
          launch_fee_paid?: number | null
          launched_at?: string | null
          max_editions?: number | null
          platform_pct?: number | null
          polygon_hash?: string | null
          price_per_nft?: number
          recharge_enabled?: boolean | null
          recharge_price?: number | null
          site_id?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_id?: string | null
          view_tier?: number | null
        }
        Update: {
          arweave_hash?: string | null
          created_at?: string | null
          creator_id?: string
          creator_pct?: number | null
          description?: string | null
          editions_minted?: number | null
          id?: string
          launch_fee_paid?: number | null
          launched_at?: string | null
          max_editions?: number | null
          platform_pct?: number | null
          polygon_hash?: string | null
          price_per_nft?: number
          recharge_enabled?: boolean | null
          recharge_price?: number | null
          site_id?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_id?: string | null
          view_tier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nft_collections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nft_collections_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "mini_site_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_listings: {
        Row: {
          created_at: string
          id: string
          nft_purchase_id: string
          price: number
          seller_id: string
          status: string
          updated_at: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nft_purchase_id: string
          price: number
          seller_id: string
          status?: string
          updated_at?: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nft_purchase_id?: string
          price?: number
          seller_id?: string
          status?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_listings_nft_purchase_id_fkey"
            columns: ["nft_purchase_id"]
            isOneToOne: false
            referencedRelation: "nft_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nft_listings_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "mini_site_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_purchases: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          is_resale: boolean | null
          original_buyer_id: string | null
          polygon_hash: string | null
          price_paid: number
          seller_id: string
          video_id: string
          views_allowed: number
          views_used: number
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          is_resale?: boolean | null
          original_buyer_id?: string | null
          polygon_hash?: string | null
          price_paid: number
          seller_id: string
          video_id: string
          views_allowed?: number
          views_used?: number
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          is_resale?: boolean | null
          original_buyer_id?: string | null
          polygon_hash?: string | null
          price_paid?: number
          seller_id?: string
          video_id?: string
          views_allowed?: number
          views_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "nft_purchases_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "mini_site_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      paywall_unlocks: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          net_to_holders: number
          platform_fee: number
          user_id: string
          video_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          net_to_holders: number
          platform_fee: number
          user_id: string
          video_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          net_to_holders?: number
          platform_fee?: number
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paywall_unlocks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_api_keys: {
        Row: {
          api_key: string
          extra_fields: Json | null
          id: string
          service_label: string
          service_name: string
          updated_at: string
        }
        Insert: {
          api_key?: string
          extra_fields?: Json | null
          id?: string
          service_label: string
          service_name: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          extra_fields?: Json | null
          id?: string
          service_label?: string
          service_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          accent_color: string
          annual_plan_price: number
          brand_hashpo_color: string
          brand_hashpo_name: string
          brand_mybik_color: string
          brand_mybik_name: string
          brand_trustbank_color: string
          brand_trustbank_name: string
          brokerage_fee_pct: number
          brokerage_to_buyback_pct: number
          brokerage_to_treasury_pct: number
          classified_listing_monthly_usd: number
          commission_ads: number
          commission_paywall: number
          commission_shares: number
          cv_creator_pct: number
          cv_directory_monthly_opens: number
          cv_directory_monthly_usd: number
          cv_platform_pct: number
          cv_unlock_price: number
          font_body: string
          font_heading: string
          footer_text: string
          grid_columns: number
          hero_text: string
          hosting_plan_bunny_price: number
          hosting_plan_youtube_price: number
          id: number
          listing_fee_gateway: number
          listing_fee_internal: number
          logo_url: string | null
          marketplace_creator_pct: number
          marketplace_fee_pct: number
          marketplace_platform_pct: number
          nft_creator_pct: number
          nft_launch_fee: number
          nft_platform_pct: number
          paywall_creator_pct: number
          paywall_expires_hours: number | null
          paywall_min_bunny: number | null
          paywall_min_embed: number | null
          paywall_min_price: number
          paywall_platform_pct: number
          platform_name: string
          platform_monthly_subscription_usd: number
          polygon_contract_address: string | null
          polygon_receiver_address: string | null
          primary_color: string
          recharge_creator_pct: number
          recharge_platform_pct: number
          slug_marketplace_fee_pct: number
          ticker_speed: number
          trading_paused: boolean
          updated_at: string
          valuation_multiplier: number
        }
        Insert: {
          accent_color?: string
          annual_plan_price?: number
          brand_hashpo_color?: string
          brand_hashpo_name?: string
          brand_mybik_color?: string
          brand_mybik_name?: string
          brand_trustbank_color?: string
          brand_trustbank_name?: string
          brokerage_fee_pct?: number
          brokerage_to_buyback_pct?: number
          brokerage_to_treasury_pct?: number
          classified_listing_monthly_usd?: number
          commission_ads?: number
          commission_paywall?: number
          commission_shares?: number
          cv_creator_pct?: number
          cv_directory_monthly_opens?: number
          cv_directory_monthly_usd?: number
          cv_platform_pct?: number
          cv_unlock_price?: number
          font_body?: string
          font_heading?: string
          footer_text?: string
          grid_columns?: number
          hero_text?: string
          hosting_plan_bunny_price?: number
          hosting_plan_youtube_price?: number
          id?: number
          listing_fee_gateway?: number
          listing_fee_internal?: number
          logo_url?: string | null
          marketplace_creator_pct?: number
          marketplace_fee_pct?: number
          marketplace_platform_pct?: number
          nft_creator_pct?: number
          nft_launch_fee?: number
          nft_platform_pct?: number
          paywall_creator_pct?: number
          paywall_expires_hours?: number | null
          paywall_min_bunny?: number | null
          paywall_min_embed?: number | null
          paywall_min_price?: number
          paywall_platform_pct?: number
          platform_name?: string
          platform_monthly_subscription_usd?: number
          polygon_contract_address?: string | null
          polygon_receiver_address?: string | null
          primary_color?: string
          recharge_creator_pct?: number
          recharge_platform_pct?: number
          slug_marketplace_fee_pct?: number
          ticker_speed?: number
          trading_paused?: boolean
          updated_at?: string
          valuation_multiplier?: number
        }
        Update: {
          accent_color?: string
          annual_plan_price?: number
          brand_hashpo_color?: string
          brand_hashpo_name?: string
          brand_mybik_color?: string
          brand_mybik_name?: string
          brand_trustbank_color?: string
          brand_trustbank_name?: string
          brokerage_fee_pct?: number
          brokerage_to_buyback_pct?: number
          brokerage_to_treasury_pct?: number
          classified_listing_monthly_usd?: number
          commission_ads?: number
          commission_paywall?: number
          commission_shares?: number
          cv_creator_pct?: number
          cv_directory_monthly_opens?: number
          cv_directory_monthly_usd?: number
          cv_platform_pct?: number
          cv_unlock_price?: number
          font_body?: string
          font_heading?: string
          footer_text?: string
          grid_columns?: number
          hero_text?: string
          hosting_plan_bunny_price?: number
          hosting_plan_youtube_price?: number
          id?: number
          listing_fee_gateway?: number
          listing_fee_internal?: number
          logo_url?: string | null
          marketplace_creator_pct?: number
          marketplace_fee_pct?: number
          marketplace_platform_pct?: number
          nft_creator_pct?: number
          nft_launch_fee?: number
          nft_platform_pct?: number
          paywall_creator_pct?: number
          paywall_expires_hours?: number | null
          paywall_min_bunny?: number | null
          paywall_min_embed?: number | null
          paywall_min_price?: number
          paywall_platform_pct?: number
          platform_name?: string
          platform_monthly_subscription_usd?: number
          polygon_contract_address?: string | null
          polygon_receiver_address?: string | null
          primary_color?: string
          recharge_creator_pct?: number
          recharge_platform_pct?: number
          slug_marketplace_fee_pct?: number
          ticker_speed?: number
          trading_paused?: boolean
          updated_at?: string
          valuation_multiplier?: number
        }
        Relationships: []
      }
      premium_slugs: {
        Row: {
          active: boolean
          buyer_id: string | null
          category: string
          created_at: string
          id: string
          keyword: string | null
          letter_count: number | null
          price: number
          slug: string
          sold: boolean
          sold_at: string | null
          sold_to: string | null
        }
        Insert: {
          active?: boolean
          buyer_id?: string | null
          category?: string
          created_at?: string
          id?: string
          keyword?: string | null
          letter_count?: number | null
          price?: number
          slug: string
          sold?: boolean
          sold_at?: string | null
          sold_to?: string | null
        }
        Update: {
          active?: boolean
          buyer_id?: string | null
          category?: string
          created_at?: string
          id?: string
          keyword?: string | null
          letter_count?: number | null
          price?: number
          slug?: string
          sold?: boolean
          sold_at?: string | null
          sold_to?: string | null
        }
        Relationships: []
      }
      private_video_urls: {
        Row: {
          created_at: string
          id: string
          video_id: string
          youtube_video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          video_id: string
          youtube_video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          video_id?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_video_urls_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "mini_site_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          display_name: string | null
          id: string
          kyc_verified: boolean
          kyc_verified_at: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      property_listings: {
        Row: {
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_urls: string[] | null
          location: string | null
          price: number
          property_type: string
          site_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          price?: number
          property_type?: string
          site_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          price?: number
          property_type?: string
          site_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_listings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      share_holdings: {
        Row: {
          acquired_at: string
          holder_id: string
          id: string
          quantity: number
          video_id: string
        }
        Insert: {
          acquired_at?: string
          holder_id: string
          id?: string
          quantity?: number
          video_id: string
        }
        Update: {
          acquired_at?: string
          holder_id?: string
          id?: string
          quantity?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_holdings_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      slug_auction_bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at: string
          id: string
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at?: string
          id?: string
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slug_auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "slug_auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      slug_auctions: {
        Row: {
          created_at: string
          current_bid: number | null
          current_bidder_id: string | null
          ends_at: string
          id: string
          keyword: string
          min_increment: number
          seller_id: string | null
          starting_price: number
          status: string
        }
        Insert: {
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          ends_at?: string
          id?: string
          keyword: string
          min_increment?: number
          seller_id?: string | null
          starting_price?: number
          status?: string
        }
        Update: {
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          ends_at?: string
          id?: string
          keyword?: string
          min_increment?: number
          seller_id?: string | null
          starting_price?: number
          status?: string
        }
        Relationships: []
      }
      slug_listings: {
        Row: {
          buyer_id: string | null
          created_at: string
          id: string
          price: number
          seller_id: string
          site_id: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          price?: number
          seller_id: string
          site_id?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          price?: number
          seller_id?: string
          site_id?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slug_listings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      slug_registrations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_free_with_plan: boolean
          registration_fee: number
          renewal_fee: number
          renewed_at: string | null
          slug: string
          slug_type: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_free_with_plan?: boolean
          registration_fee?: number
          renewal_fee?: number
          renewed_at?: string | null
          slug: string
          slug_type?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_free_with_plan?: boolean
          registration_fee?: number
          renewal_fee?: number
          renewed_at?: string | null
          slug?: string
          slug_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      slug_transactions: {
        Row: {
          amount: number
          auction_id: string | null
          buyer_id: string
          created_at: string
          id: string
          listing_id: string | null
          net_to_seller: number
          platform_fee_amount: number
          platform_fee_pct: number
          seller_id: string
          slug: string
          tx_type: string
        }
        Insert: {
          amount: number
          auction_id?: string | null
          buyer_id: string
          created_at?: string
          id?: string
          listing_id?: string | null
          net_to_seller?: number
          platform_fee_amount?: number
          platform_fee_pct?: number
          seller_id: string
          slug: string
          tx_type?: string
        }
        Update: {
          amount?: number
          auction_id?: string | null
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          net_to_seller?: number
          platform_fee_amount?: number
          platform_fee_pct?: number
          seller_id?: string
          slug?: string
          tx_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "slug_transactions_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "slug_auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slug_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "slug_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      slug_transfers: {
        Row: {
          completed_at: string | null
          created_at: string
          from_user_id: string
          id: string
          registration_id: string | null
          site_id: string | null
          slug: string
          status: string
          to_email: string | null
          to_user_id: string
          transfer_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          registration_id?: string | null
          site_id?: string | null
          slug: string
          status?: string
          to_email?: string | null
          to_user_id: string
          transfer_type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          registration_id?: string | null
          site_id?: string | null
          slug?: string
          status?: string
          to_email?: string | null
          to_user_id?: string
          transfer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "slug_transfers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      subdomain_auctions: {
        Row: {
          created_at: string
          current_bid: number | null
          current_bidder_id: string | null
          ends_at: string
          id: string
          min_price: number
          slug: string
          slug_length: number
          starts_at: string
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          ends_at?: string
          id?: string
          min_price?: number
          slug: string
          slug_length?: number
          starts_at?: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          ends_at?: string
          id?: string
          min_price?: number
          slug?: string
          slug_length?: number
          starts_at?: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      subdomain_bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at: string
          id: string
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at?: string
          id?: string
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subdomain_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "subdomain_auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          brokerage_fee_amount: number | null
          buyer_id: string | null
          created_at: string
          fee_to_buyback: number | null
          fee_to_treasury: number | null
          gross_amount: number | null
          id: string
          net_amount: number | null
          price_per_share: number
          seller_id: string | null
          shares_qty: number
          total_amount: number
          tx_type: string
          video_id: string
        }
        Insert: {
          brokerage_fee_amount?: number | null
          buyer_id?: string | null
          created_at?: string
          fee_to_buyback?: number | null
          fee_to_treasury?: number | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          price_per_share: number
          seller_id?: string | null
          shares_qty: number
          total_amount: number
          tx_type: string
          video_id: string
        }
        Update: {
          brokerage_fee_amount?: number | null
          buyer_id?: string | null
          created_at?: string
          fee_to_buyback?: number | null
          fee_to_treasury?: number | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          price_per_share?: number
          seller_id?: string | null
          shares_qty?: number
          total_amount?: number
          tx_type?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_badges: {
        Row: {
          annual_price: number
          badge_type: string
          company_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          kyc_data: Json | null
          monthly_price: number
          paid_amount: number
          plan_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_price?: number
          badge_type?: string
          company_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kyc_data?: Json | null
          monthly_price?: number
          paid_amount?: number
          plan_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_price?: number
          badge_type?: string
          company_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kyc_data?: Json | null
          monthly_price?: number
          paid_amount?: number
          plan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_paywall_unlocks: {
        Row: {
          amount_paid: number
          created_at: string
          creator_share: number
          expires_at: string | null
          id: string
          payment_provider: string
          platform_share: number
          stripe_checkout_session_id: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          creator_share?: number
          expires_at?: string | null
          id?: string
          payment_provider?: string
          platform_share?: number
          stripe_checkout_session_id?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          creator_share?: number
          expires_at?: string | null
          id?: string
          payment_provider?: string
          platform_share?: number
          stripe_checkout_session_id?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_paywall_unlocks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "mini_site_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reviewed: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_reports_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          ai_content: boolean
          blocked: boolean
          boost_count: number
          boost_home_at: string | null
          boost_home_expires_at: string | null
          boost_maintenance_paid_at: string | null
          boost_rank: number
          boost_total_spent: number
          category: string
          created_at: string
          creator_id: string | null
          description: string | null
          dex_mode: boolean
          exchange_active: boolean
          featured: boolean
          hashtags: string[] | null
          hosting_type: string
          id: string
          legal_hash: string | null
          like_count: number
          listing_expires_at: string | null
          listing_plan: string | null
          made_for_kids: boolean
          metadata_hash: string | null
          paywall_price: number
          polygon_hash: string | null
          report_count: number
          revenue: number
          share_price: number
          shares_issued: boolean
          status: string
          subcategory: string | null
          thumbnail_url: string | null
          ticker: string
          title: string
          total_shares: number
          under_review: boolean
          updated_at: string
          video_hash: string | null
          video_url: string | null
        }
        Insert: {
          ai_content?: boolean
          blocked?: boolean
          boost_count?: number
          boost_home_at?: string | null
          boost_home_expires_at?: string | null
          boost_maintenance_paid_at?: string | null
          boost_rank?: number
          boost_total_spent?: number
          category: string
          created_at?: string
          creator_id?: string | null
          description?: string | null
          dex_mode?: boolean
          exchange_active?: boolean
          featured?: boolean
          hashtags?: string[] | null
          hosting_type?: string
          id?: string
          legal_hash?: string | null
          like_count?: number
          listing_expires_at?: string | null
          listing_plan?: string | null
          made_for_kids?: boolean
          metadata_hash?: string | null
          paywall_price?: number
          polygon_hash?: string | null
          report_count?: number
          revenue?: number
          share_price?: number
          shares_issued?: boolean
          status?: string
          subcategory?: string | null
          thumbnail_url?: string | null
          ticker: string
          title: string
          total_shares?: number
          under_review?: boolean
          updated_at?: string
          video_hash?: string | null
          video_url?: string | null
        }
        Update: {
          ai_content?: boolean
          blocked?: boolean
          boost_count?: number
          boost_home_at?: string | null
          boost_home_expires_at?: string | null
          boost_maintenance_paid_at?: string | null
          boost_rank?: number
          boost_total_spent?: number
          category?: string
          created_at?: string
          creator_id?: string | null
          description?: string | null
          dex_mode?: boolean
          exchange_active?: boolean
          featured?: boolean
          hashtags?: string[] | null
          hosting_type?: string
          id?: string
          legal_hash?: string | null
          like_count?: number
          listing_expires_at?: string | null
          listing_plan?: string | null
          made_for_kids?: boolean
          metadata_hash?: string | null
          paywall_price?: number
          polygon_hash?: string | null
          report_count?: number
          revenue?: number
          share_price?: number
          shares_issued?: boolean
          status?: string
          subcategory?: string | null
          thumbnail_url?: string | null
          ticker?: string
          title?: string
          total_shares?: number
          under_review?: boolean
          updated_at?: string
          video_hash?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          fee: number
          id: string
          net_amount: number
          status: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          fee?: number
          id?: string
          net_amount: number
          status?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          net_amount?: number
          status?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_mini_site_public: { Args: { p_slug: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
