Shader "Custom/VivifyMetallic"
{
    Properties
    {
        _Color ("Color", Color) = (0.5, 0.5, 0.5, 1.0)
        _MainTex ("Albedo (RGB)", 2D) = "white" {}
        _Glossiness ("Smoothness", Range(0,1)) = 0.75
        _Metallic ("Metallic", Range(0,1)) = 1.0
        _AmbientFill ("Ambient Edge Fill", Range(0,1)) = 0.15
    }
    SubShader
    {
        Tags { "Queue"="Geometry" "RenderType"="Opaque" }
        LOD 200

        Blend One Zero

        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows keepalpha

        #pragma target 3.0

        sampler2D _MainTex;

        struct Input
        {
            float2 uv_MainTex;
            float3 viewDir; // Access the camera view direction
        };

        half _Glossiness;
        half _Metallic;
        half _AmbientFill;
        fixed4 _Color;

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
            
            // Calculate a Fresnel effect (1.0 at steep grazing angles, 0.0 looking straight on)
            half fresnel = 1.0 - saturate(dot(normalize(IN.viewDir), o.Normal));
            
            // Apply the base color, but inject ambient lighting on the edges based on the Fresnel factor
            o.Albedo = c.rgb + (c.rgb * fresnel * _AmbientFill);
            
            // If you want the metallic reflection to also catch the edges better:
            o.Emission = unity_AmbientSky.rgb * _AmbientFill * (1.0 - o.Metallic);

            o.Metallic = _Metallic;
            o.Smoothness = _Glossiness;
            
            o.Alpha = 0.0;
        }
        ENDCG
    }
    FallBack "Diffuse"
}