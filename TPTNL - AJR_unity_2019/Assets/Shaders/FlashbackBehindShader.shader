Shader "Custom/FlashbackBehindShader"
{
    Properties
    {
        _Color ("Flash Color", Color) = (1.0, 1.0, 1.0, 1.0)
        _EdgeSoftness ("Edge Softness", Range(0.001, 0.5)) = 0.1
        _Inset ("Rectangle Inset", Range(0.0, 0.45)) = 0.0
    }
    SubShader
    {
        Tags 
        { 
            "Queue"="Transparent-100" 
            "RenderType"="Transparent" 
            "IgnoreProjector"="True"
        }
        LOD 100

        Pass
        {
            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off
            Cull Off
            // ColorMask RGB ensures the framebuffer's alpha channel (Beat Saber bloom) is untouched
            ColorMask RGB

            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing 
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            fixed4 _Color;
            float _EdgeSoftness;
            float _Inset;

            v2f vert (appdata v)
            {
                v2f o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_OUTPUT(v2f, o);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(i);

                // Remap UVs to [-1, 1]
                float2 uv = i.uv * 2.0 - 1.0;
                float2 d = abs(uv);
                
                // Calculate smooth rectangular mask
                float2 edge = smoothstep(1.0 - _Inset, 1.0 - _Inset - _EdgeSoftness, d);
                float mask = edge.x * edge.y;

                // Modulate color and alpha by the mask
                fixed4 col = _Color;
                col.a *= mask;

                return col;
            }
            ENDCG
        }
    }
}