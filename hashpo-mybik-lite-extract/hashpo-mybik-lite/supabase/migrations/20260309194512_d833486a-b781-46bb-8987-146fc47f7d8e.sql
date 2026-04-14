CREATE OR REPLACE FUNCTION public.get_mini_site_public(p_slug text)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT row_to_json(t) FROM (
    SELECT id, user_id, slug, site_name, bio, avatar_url, banner_url,
           theme, template_id, layout_columns, published, show_cv, custom_css,
           cv_headline, cv_location, cv_content, cv_skills, cv_experience, cv_education, cv_portfolio,
           contact_price, contact_email, contact_phone,
           bg_style, font_size, photo_shape, photo_size, blocked, monthly_price,
           boost_rank, boost_expires_at,
           created_at, updated_at
    FROM public.mini_sites
    WHERE slug = p_slug AND published = true
  ) t
$$;