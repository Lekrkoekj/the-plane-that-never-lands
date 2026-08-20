// Upgrade NOTE: replaced '_Object2World' with 'unity_ObjectToWorld'

Shader "Unlit Flashback Cutout"
{
    Properties
    {
        _Color ("Color Day", Color) = (1,1,1,1)
        _ColorNight ("Color Night", Color) = (1,1,1,1)
        _Tex ("Texture", 2D) = "white" {}
        _Bloom ("Glow", Range (0, 1)) = 0
        _DitherMaskScale("Dither Mask Scale", Float) = 40
        _DitherMask("Dither Mask", 2D) = "black" {}
        _Alpha("Alpha", Float) = 1
        _Cutout ("Cutout", Range (0, 1)) = 0.5
        _DayNightCycle("Day/Night Cycle", Range(0, 1)) = 1

        // Vignette Properties
        _VignetteColor ("Vignette Color", Color) = (1,1,1,1)
        _VignetteSize ("Vignette Size", Range(0, 2)) = 0.8
        _VignetteSmoothness ("Vignette Smoothness", Range(0.001, 1)) = 0.1
    }
    SubShader
    {
        Tags { "RenderType"="Opaque"}
        LOD 100
        Cull Off

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                fixed4 color : COLOR;
                float2 uv : TEXCOORD0;

                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 scrPos : TEXCOORD1;
                float4 vertex : SV_POSITION;
                half4 color : COLOR;
                
                UNITY_VERTEX_OUTPUT_STEREO
            };

            float4 _Color;
            float4 _ColorNight;
            float _Bloom;
            sampler2D _DitherMask;
            float _DitherMaskScale;
            float _Alpha;
            float _Cutout;
            float _DayNightCycle;

            // Vignette Uniforms
            float4 _VignetteColor;
            float _VignetteSize;
            float _VignetteSmoothness;

            sampler2D _Tex;
            float4 _Tex_ST;
            
            v2f vert (appdata v)
            {
                v2f o;

                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_OUTPUT(v2f, o);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                o.color = v.color;
                o.scrPos = ComputeScreenPos(o.vertex);
                return o;
            }
            
            fixed4 frag (v2f i) : SV_Target
            {
                float2 uvTransformed = TRANSFORM_TEX(i.uv, _Tex);
                fixed4 col = ((_Color * _DayNightCycle) + (_ColorNight * (1.0 - _DayNightCycle))) * tex2D(_Tex, uvTransformed);

                if (col.a < _Cutout) discard;

                float4 ase_screenPos = float4(i.scrPos.xyz, i.scrPos.w + 0.00000000001);
                float4 ase_screenPosNorm = ase_screenPos / ase_screenPos.w;

                if (tex2D(_DitherMask, ase_screenPosNorm.xy * _ScreenParams.xy * _DitherMaskScale).r >= _Alpha * i.color.a) discard;

                // --- Rectangular UV Vignette Calculation ---
                float2 d = abs(i.uv - 0.5) * 2.0;
                float edgeFactor = max(d.x, d.y);
                float vignetteFactor = smoothstep(_VignetteSize - _VignetteSmoothness, _VignetteSize, edgeFactor);
                col.rgb = lerp(col.rgb, _VignetteColor.rgb, vignetteFactor);

                col *= float4(i.color.rgb, 0.0);
                col.a = _Bloom;

                return col;
            }
            ENDCG
        }
    }
}